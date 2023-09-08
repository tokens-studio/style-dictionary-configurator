import { Box } from '@tokens-studio/ui';

export const Sidebar = ({ children }) => {

    return <Box css={{

        minWidth: '350px',
        maxWidth: '650px',
        overflowY: 'auto',
        padding: '$7',
        borderRight: '1px solid $borderMuted',
        boxSizing: 'border-box'
    }}>
        {children}

    </Box>;
};