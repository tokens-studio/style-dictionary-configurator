import { BookIcon, PlugIcon, UploadIcon } from '@iconicicons/react';
import { Button, Heading, Stack, Text } from '@tokens-studio/ui';
export const Nav = () => {
    return (

        <Stack justify='between' css={{ padding: '$7', borderBottom: '1px solid $borderMuted' }}>
            <Heading size='xlarge'>Style-Dictionary Configurator</Heading>
            <Stack gap={6}>
                <Button variant='primary' id="upload-tokens-btn" icon={<UploadIcon />}> Upload tokens
                    <input
                        id="upload-tokens-input"
                        type="file"
                        accept="application/*, text/*"
                        aria-hidden="true"
                        hidden
                    />
                </Button>
                <Button variant="secondary" id="eject-btn" title="Eject by downloading your project so that you can run it locally." icon={<PlugIcon />}> Eject
                    <input
                        id="upload-tokens-input"
                        type="file"
                        accept="application/*, text/*"
                        aria-hidden="true"
                        hidden
                    />
                </Button>
                <nav className="header-nav">
                    <a href="https://www.youtube.com/watch?v=dr3RWjZ28BE">
                        <Button variant="secondary" icon={<BookIcon />}>
                            Docs
                        </Button>
                    </a>
                </nav>
            </Stack>
        </Stack>
    );
};
