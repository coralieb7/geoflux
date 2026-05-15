"""
Builds tradeconnections.json (ISO3-keyed top-3 trade partner data).
Run from the notebooks/ directory: python3 build_tradeconnections.py
"""
import pandas as pd
import json
import pycountry
import kagglehub
from kagglehub import KaggleDatasetAdapter
from pathlib import Path

YEARS   = list(range(1988, 2017))
OUT_DIR = Path('../app/utils/generated')
OUT_DIR.mkdir(exist_ok=True)

# Country name → ISO3 overrides (None = aggregate / unresolvable → excluded from output)
OVERRIDES: dict[str, str | None] = {
    ' World':                          None,
    'World':                           None,
    'European Union':                  'EUU',
    'Anguila':                         'AIA',   # misspelling of Anguilla
    'Bahamas, The':                    'BHS',
    'Belgium-Luxembourg':              'BEL',   # pre-1999 customs union → Belgium
    'Br. Antr. Terr':                  None,    # no standard ISO3
    'British Indian Ocean Ter.':       'IOT',
    'Bunkers':                         None,
    'Cape Verde':                      'CPV',
    'Congo, Dem. Rep.':                'COD',
    'Congo, Rep.':                     'COG',
    'Curaзao':                         'CUW',   # encoding artefact for Curaçao
    'Czechoslovakia':                  None,    # dissolved 1993
    'East Timor':                      'TLS',
    'Egypt, Arab Rep.':                'EGY',
    'Ethiopia(excludes Eritrea)':      'ETH',
    'Ethiopia(includes Eritrea)':      'ETH',
    'Faeroe Islands':                  'FRO',
    'Fm Sudan':                        'SDN',
    'Fr. So. Ant. Tr':                 'ATF',
    'Free Zones':                      None,
    'Gambia, The':                     'GMB',
    'German Democratic Republic':      'DEU',   # East Germany → unified Germany
    'Hong Kong, China':                'HKG',
    'Iran, Islamic Rep.':              'IRN',
    'Korea, Dem. Rep.':                'PRK',
    'Korea, Rep.':                     'KOR',
    'Lao PDR':                         'LAO',
    'Micronesia, Fed. Sts.':           'FSM',
    'Netherlands Antilles':            None,    # dissolved 2010
    'Neutral Zone':                    None,
    'Occ.Pal.Terr':                    'PSE',
    'Other Asia, nes':                 None,
    'Pacific Islands':                 None,
    'Saint Barthйlemy':                'BLM',   # encoding artefact for Saint Barthélemy
    'Saint Maarten (Dutch part)':      'SXM',
    'Serbia, FR(Serbia/Montenegro)':   'SRB',
    'Soviet Union':                    None,    # dissolved 1991
    'Special Categories':              None,
    'St. Kitts and Nevis':             'KNA',
    'St. Lucia':                       'LCA',
    'St. Vincent and the Grenadines':  'VCT',
    'Turkey':                          'TUR',   # pycountry updated to Türkiye
    'Turks and Caicos Isl.':           'TCA',
    'Unspecified':                     None,
    'Us Msc.Pac.I':                    'UMI',
    'Wallis and Futura Isl.':          'WLF',
    'Yemen Democratic':                'YEM',   # South Yemen → unified Yemen
    'Yugoslavia,FR(Serbia/Montenegr':  None,    # dissolved
}

_cache: dict[str, str | None] = {}

def resolve(name: str) -> str | None:
    name = name.strip()
    if name in _cache:
        return _cache[name]
    if name in OVERRIDES:
        _cache[name] = OVERRIDES[name]
        return OVERRIDES[name]
    try:
        iso3 = pycountry.countries.search_fuzzy(name)[0].alpha_3
    except LookupError:
        iso3 = None
    _cache[name] = iso3
    return iso3


print('Loading dataset...')
df_bilateral = kagglehub.dataset_load(
    KaggleDatasetAdapter.PANDAS,
    'appetukhov/international-trade-database',
    'trade_1988_2021.csv',
).rename(columns={
    'ReporterName':           'reporter',
    'PartnerName':            'partner',
    'Year':                   'year',
    'TradeValue in 1000 USD': 'trade_value',
})
df_bilateral = df_bilateral[df_bilateral['year'].isin(YEARS)].copy()

# Pre-resolve every unique name so _cache is fully populated before groupby.apply
print('Resolving country names to ISO3...')
for name in set(df_bilateral['reporter'].unique()) | set(df_bilateral['partner'].unique()):
    resolve(name)

# Compute per-country totals for percentage calculation
exports_totals = (df_bilateral.groupby(['reporter', 'year'])['trade_value']
                  .sum().reset_index().rename(columns={'trade_value': 'total_exports'}))
imports_totals = (df_bilateral.groupby(['partner', 'year'])['trade_value']
                  .sum().reset_index().rename(columns={'trade_value': 'total_imports'}))

df_exports = df_bilateral.merge(exports_totals, on=['reporter', 'year'])
df_exports['percentage'] = (df_exports['trade_value'] / df_exports['total_exports']) * 100

df_imports = df_bilateral.merge(imports_totals, on=['partner', 'year'])
df_imports['percentage'] = (df_imports['trade_value'] / df_imports['total_imports']) * 100


def get_top_3(group, name_col):
    # Drop any partner that has no valid ISO3 (World, aggregates, dissolved states, etc.)
    filtered = group[group[name_col].map(_cache).notna()]
    top3 = filtered.nlargest(3, 'percentage')
    return dict(zip(top3[name_col], top3['percentage'].round(2)))


print('Computing top-3 export/import partners...')
top_exports = (df_exports.groupby(['reporter', 'year'])
               .apply(lambda x: get_top_3(x, 'partner'))
               .reset_index(name='top3exportCountries'))

top_imports = (df_imports.groupby(['partner', 'year'])
               .apply(lambda x: get_top_3(x, 'reporter'))
               .reset_index(name='top3importers'))

# Accumulate into an intermediate dict keyed by country name
trade_partners: dict[str, dict] = {}
for _, row in top_exports.iterrows():
    trade_partners.setdefault(row['reporter'], {}).setdefault(str(row['year']), {})['top3exportCountries'] = row['top3exportCountries']
for _, row in top_imports.iterrows():
    trade_partners.setdefault(row['partner'], {}).setdefault(str(row['year']), {})['top3importers'] = row['top3importers']

# Rekey: country names → ISO3 at both the top level and inside partner dicts
print('Rekeying to ISO3 and writing output...')
out: dict[str, dict] = {}
skipped_countries: set[str] = set()
skipped_partners:  set[str] = set()
duplicate_iso3:    set[str] = set()

for country_name, years in trade_partners.items():
    iso3 = resolve(country_name)
    if not iso3:
        skipped_countries.add(country_name)
        continue
    if iso3 in out:
        duplicate_iso3.add(f'{country_name} → {iso3}')

    country_out = out.setdefault(iso3, {})
    for year, year_data in years.items():
        year_out = country_out.setdefault(year, {})
        for key in ('top3exportCountries', 'top3importers'):
            partners_raw = year_data.get(key, {})
            partners_iso3: dict[str, float] = {}
            for partner_name, val in partners_raw.items():
                p_iso3 = resolve(partner_name)
                if p_iso3:
                    partners_iso3[p_iso3] = val
                else:
                    skipped_partners.add(partner_name.strip())
            if partners_iso3:
                year_out[key] = partners_iso3

with open(OUT_DIR / 'tradeconnections.json', 'w') as f:
    json.dump(out, f, separators=(',', ':'))

sz = (OUT_DIR / 'tradeconnections.json').stat().st_size // 1024
print(f'Written {len(out)} countries → tradeconnections.json ({sz} KB)')
if duplicate_iso3:
    print(f'Merged duplicates ({len(duplicate_iso3)}): {sorted(duplicate_iso3)}')
if skipped_countries:
    print(f'Skipped countries ({len(skipped_countries)}): {sorted(skipped_countries)}')
if skipped_partners:
    print(f'Skipped partners  ({len(skipped_partners)}): {sorted(skipped_partners)}')
