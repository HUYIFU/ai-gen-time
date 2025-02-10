import React, { useState, useEffect, JSX } from "react";
import { MDXProvider } from "@mdx-js/react";
import * as runtime from "react/jsx-runtime";
import { compile } from "@mdx-js/mdx";

export const RenderMDX = ({ source }: { source: string }) => {
  const [MDXComponent, setMDXComponent] = useState<JSX.Element | null>(null);

  useEffect(() => {
    async function compileMdx() {
      try {
        // compile 返回的是一个包含 JSX 代码的字符串
        const compiledCode = String(
          await compile(source, {
            // 指定 providerImportSource 以便后续使用 MDXProvider
            providerImportSource: "@mdx-js/react",
          })
        );

        // 构造一个作用域，包含 React 和 runtime 中的所有导出
        const scope = { React, ...runtime };

        // 创建一个新函数，该函数的参数名为 scope 中的各个 key，
        // 函数体为编译后的代码。执行后应返回一个模块对象，其中 default 导出为 MDX 组件。
        const fn = new Function(...Object.keys(scope), `${compiledCode}`);
        const result = fn(...Object.values(scope));
        setMDXComponent(() => result.default);
      } catch (err) {
        console.error("Error compiling MDX:", err);
      }
    }

    compileMdx();
  }, [source]);

  if (!MDXComponent) {
    return <div>Loading MDX...</div>;
  }

  return <MDXProvider>{MDXComponent}</MDXProvider>;
};
