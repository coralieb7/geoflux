interface NavEntry {
  path: string
  label: string
}

export const useNavHistory = () => {
  const stack  = useState<NavEntry[]>('nav-stack', () => [])
  const router = useRouter()
  const route  = useRoute()

  function push(path: string, currentLabel: string) {
    stack.value = [...stack.value, { path: route.fullPath, label: currentLabel }]
    router.push(path)
  }

  function goBack() {
    if (stack.value.length === 0) { router.back(); return }
    const { path } = stack.value[stack.value.length - 1]
    stack.value = stack.value.slice(0, -1)
    router.push(path)
  }

  function jumpTo(index: number) {
    const { path } = stack.value[index]
    stack.value = stack.value.slice(0, index)
    router.push(path)
  }

  function clear() {
    stack.value = []
  }

  const previousPath  = computed(() => stack.value.at(-1)?.path  ?? null)
  const previousLabel = computed(() => stack.value.at(-1)?.label ?? null)

  return { stack, previousPath, previousLabel, push, goBack, jumpTo, clear }
}
