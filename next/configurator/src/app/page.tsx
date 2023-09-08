'use client';

import { ConfigArea } from '@/components/configArea';
import { Content } from '@/components/content';
import { Nav } from '@/components/nav';
import { Sidebar } from '@/components/sidebar';
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Content>
          <Sidebar>
            <token-platforms></token-platforms>
          </Sidebar>
          <ConfigArea>
            <config-switcher id="config-switcher"></config-switcher>
            <div className="monaco-wrapper config">
              <div
                id="monaco-container-config"
                className="monaco-container"
              // style="height: 100%"
              ></div>
            </div>
            <div className="monaco-wrapper output">
              <file-tree id="output-file-tree"></file-tree>
              <div
                id="monaco-container-output"
                className="monaco-container"
              // style="height: 100%"
              ></div>
            </div>
          </ConfigArea>
        </Content>
      </main>
    </>
  );
}
