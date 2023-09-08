import { Stack } from "@tokens-studio/ui"

export const Content = ({ children }) => {
    return <Stack css={{ height: '100%' }}>
        {children}
    </Stack>
}