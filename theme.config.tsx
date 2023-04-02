import React, { useState } from 'react'
import { DocsThemeConfig, useTheme, useConfig } from 'nextra-theme-docs'
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import icon from './public/assets/icon.jpg';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript'
import scss from 'react-syntax-highlighter/dist/cjs/languages/prism/scss'
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash'
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'
import rangeParser from 'parse-numeric-range'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('scss', scss)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('json', json)

const MarkdownComponents: object = {
  code({ node, inline, className, ...props }) {

    const match = /language-(\w+)/.exec(className || '')
    const hasMeta = node?.data?.meta

    const applyHighlights: object = (applyHighlights: number) => {
      if (hasMeta) {
        const RE = /{([\d,-]+)}/
        const metadata = node.data.meta?.replace(/\s/g, '')
        const strlineNumbers = RE?.test(metadata)
          ? RE?.exec(metadata)[1]
          : '0'
        const highlightLines = rangeParser(strlineNumbers)
        const highlight = highlightLines
        const data: string = highlight.includes(applyHighlights)
          ? 'highlight'
          : null
        return { data }
      } else {
        return {}
      }
    }

    return match ? (
      <SyntaxHighlighter
        children={""}
        style={oneDark}
        // language={match[1]}
        PreTag="div"
        className="codeStyle"
        // showLineNumbers={true}
        wrapLines={hasMeta ? true : false}
        useInlineStyles={true}
        lineProps={applyHighlights}
        {...props}
      />
    ) : (
      <code className={className} {...props} />
    )
  },
}

const Modal = ({ children, open, onClose }) => {
  const theme = useTheme();
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: theme.resolvedTheme === 'dark' ? '#1a1a1a' : 'white',
          padding: 20,
          borderRadius: 5,
          width: '80%',
          maxWidth: 700,
          maxHeight: '80%',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};


const questions = [
  'How do I get started with Nextra?',
]

interface EmbedbaseSearchBarProps {
  value?: string;
  onChange?: (e: any) => void;
  autoFocus?: boolean;
  placeholder?: string;
  onClick?: () => void;
}

const EmbedbaseSearchBar = ({ value, onChange, autoFocus, placeholder, onClick }: EmbedbaseSearchBarProps) => {
  return (
    <input
      autoFocus={autoFocus || false}
      placeholder={placeholder || "Search..."}
      onClick={onClick}
      type="text"
      value={value}
      onChange={onChange}
      // border around with smooth corners, a magnifier icon on the left,
      // the search bar taking up the rest of the space
      // focused on load
      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', outline: 'none' }}
    />
  );
}

const SearchModal = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);

  const onClose = () => {
    setOpen(false);
    setPrompt("");
    setOutput("");
    setLoading(false);
  }

  const qa = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    const promptResponse = await fetch("/api/buildPrompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });
    const promptData = await promptResponse.json();
    const response = await fetch("/api/qa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: promptData.prompt,
      }),
    });
    setLoading(false);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setOutput((prev) => prev + chunkValue);
    }

    setLoading(false);
  };
  // a nice looking input search bar with cmd k to open
  // on open, show a modal with a form to enter a prompt
  return <div>
    {/* on click, open modal */}
    <EmbedbaseSearchBar onClick={() => setOpen(true)} placeholder="ChatGPT answer..." />
    <Modal open={open} onClose={onClose}>
      <form onSubmit={qa} className="nx-flex nx-gap-3">
        <EmbedbaseSearchBar value={prompt} onChange={(e) => setPrompt(e.target.value)} autoFocus />
        <button
          className="nx-rounded-full nx-bg-sky-300 nx-py-2 nx-px-4 nx-text-sm nx-font-semibold nx-text-slate-900 nx-hover:nx-bg-sky-200 nx-focus:outline-none focus-visible:outline-2 focus-visible:nx-outline-offset-2 nx-focus-visible:nx-outline-sky-300/50 nx-active:bg-sky-500 nx-max-w-max"
          type="submit"
        >
          Ask
        </button>
      </form>
      {/* row oriented, centered, with a gap of 3 */}
      <div className="nx-flex nx-gap-3 nx-py-4 nx-min-h-40 nx-flex-col">
        {!loading && output.length < 1 && (
          <div className="nx-text-gray-400	nx-text-sm nx-font-semibold">
            Your result will appear here
          </div>
        )}
        {loading && (
          <div className="nx-flex nx-items-center nx-justify-center">
            <span>Loading...</span>
            <div
              style={{
                width: "1rem",
                height: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "50%",
                borderTopColor: "black",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
        )}

        {!loading && output.length > 0 && (
          <ReactMarkdown
            components={MarkdownComponents}
          >{output}</ReactMarkdown>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          marginTop: "1rem",
        }}
      >
        {/* try one of these samples */}
        <div className="nx-mt-2">Try one of these samples:</div>
        <div
          style={{
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 600,
          }}
          // examples as a list of bullets
          className="nx-flex-row"
        >
          <ul>
            {questions.map((q) => (
              // in row orientation, centered, with a gap of 3
              <li key={q} onClick={() => setPrompt(q)}>
                - {q}
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem 0",
            fontSize: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.25rem",
            }}
          >
            <a href="https://embedbase.xyz" className="underline">
              Powered by Embedbase
            </a>
          </div>
        </div>
      </div>
    </Modal>
  </div>
};

const config: DocsThemeConfig = {
  logo: (
    <>
      <svg width="54" height="50" viewBox="0 0 54 50">
        <path
          fill="currentColor"
          d="M27 .4c0 .2.8 1 1.8 1.7 1.5 1.3 1.6 1.2.3-.4S27-.4 27 .4zM34.2 8.8c-1.8 2.4-2 2.5-1.5.5.4-1.9.1-2.2-2.6-2.1-1.7.1-3.1.4-3.1.7 0 .6-4.2 2.9-9 4.8-9.7 4-10 4-10 1.8 0-.8-.7-1.5-1.5-1.5S5 13.4 5 14c0 .5.5 1 1 1 .7 0 .7.6 0 1.9-.8 1.6-.4 2.6 2.4 5.4 1.8 1.9 3.8 3.6 4.4 3.8.6.2 1.4 1.6 1.7 3.1.6 2.2.4 2.8-.9 2.8-1.5 0-2.2 1.6-2.9 7.6l-.3 3.1 11.3.6c6.5.4 12.4.2 13.9-.3 1.4-.6 4.3-1 6.5-1 3.3 0 4.1-.4 4.9-2.6 1.3-3.3 1.3-3.4-.6-2.7-1.2.4-1.5 0-1.2-1.8.2-1.3.9-2.3 1.6-2.2 1.4.3 1.5-.6.3-2.6-.7-1.1-1.1-1-2 .5-.6 1.1-1.1 1.4-1.1.8 0-.5-.7-1.9-1.5-3-1.4-1.8-1.4-1.8-1 .4.2 1.2 0 2-.5 1.7-.5-.3-1.1-.1-1.5.5-.9 1.4-2.6 1.3-2.2-.2.1-.7-.4-1.2-1.2-1.3-1.6 0-2.9-2.5-1.4-2.5 1 0 1-2.6-.1-5-.3-.8-.8-3-1-4.8-.2-1.8-.6-3.6-1-3.9-.3-.3.3-1.2 1.4-2 1.1-.8 2-2.2 2-3.1 0-1.5.2-1.5 1-.2.5.8.5 1.9.1 2.3-.5.5-.3 1.9.3 3.2 1.2 2.5 4.2 3.9 5.2 2.4.3-.5-.4-.9-1.4-.9-1.6 0-1.9-.5-1.5-2.3.3-1.6.2-1.8-.5-.8-.6.8-1.2 1-1.6.3-.3-.6.6-1.7 2-2.4 3.6-1.8 3.5-3.3-.2-3.5-2.3-.1-3.7.6-5.2 2.5zm6.3-.8c-.3.5-1.2 1-1.8 1-.7 0-.6-.4.3-1 1.9-1.2 2.3-1.2 1.5 0zm-9.7 1.7c-.6.7-1.8 1.3-2.7 1.2-1 0-1.2-.2-.3-.6.6-.2 1-.8.8-1.2-.3-.4.4-.7 1.4-.7 1.4 0 1.6.3.8 1.3zM26.5 13c1.2-2 3.1-1 4.8 2.6 2.1 4.4 1.6 5.4-2.9 5.4-1.9 0-3.3.4-3 .9.3.5-.7 1.1-2.2 1.4-3.5.7-4.1 0-1.1-1.2 1.3-.5 1.9-1 1.2-1-.6-.1-3.1.7-5.5 1.7-2.4 1.1-4.9 1.7-5.6 1.5-1-.4-4.2-5.3-4.2-6.6 0-.4 5.4-1.9 7.5-2.1.6-.1 1.4-.6 1.8-1.1.5-.6.7-.3.4.7-.4 1.2.2 1.9 2.1 2.6 2.7.9 2.6.9-1.6 2.1-2.4.7-5.2.9-6.4.5-1.4-.4-1.8-.2-1.4.5 1 1.5 6.6 1.3 9.5-.3 1.4-.8 3.2-1.2 4-.9 1.2.3 1.1.1-.1-.7-1.8-1.1-2.4-5-1.1-6.3.3-.4 1.2-.2 1.9.4.8.7 1.4.7 1.9-.1zM21 15.1c0 1.1-.4 1.7-1 1.4-.5-.3-1-1.3-1-2.1s.5-1.4 1-1.4c.6 0 1 .9 1 2.1zm11.6 8.1c-.2 1.4-1 2.2-2 2.2-1.4-.2-1.5.1-.4 1.4 1.1 1.3 1 1.5-.9 1-2.3-.6-3.3.7-1.1 1.4 1.9.7-.2 2.8-2.8 2.8-2.9 0-2.9-.2-.2-5.6 1.5-3.1 2.8-4.4 4.7-4.7 1.4-.2 2.7-.5 2.8-.6.2 0 .1.9-.1 2.1zm-9.5 4.9c-1.5 3.7-4.1 5.3-4.1 2.6 0-.9-.3-.8-.9.2-.6.9-1.1 1-1.5.2-.4-.6.4-1.6 1.8-2.3 2.7-1.2 3.3-2.3 1.6-3.3-.5-.3-1 .1-1 .9 0 2-3.6 2.1-4.3.2-.6-1.5.9-2 6.9-2.3l3.2-.1-1.7 3.9zm10.6.9c.2 2.4-.2 3-1.7 3-2 0-1.9-2 .3-4.8 1.2-1.6 1.2-1.7 1.4 1.8zm-17.3 7.2-.5 3.3 1.5-3.3c2.1-4.4 5-4.4 4.2 0l-.6 3.3 1.7-3.3c.9-1.8 2.4-3.2 3.5-3.2 2.3 0 2.3.3-.8 5-3.4 5.2-6.8 5.6-6 .7l.6-3.2-1.7 3.2c-1.2 2.4-2.4 3.3-4.1 3.3-1.8 0-2.3-.4-1.8-1.6.3-.9.6-2.9.6-4.5 0-2.2.5-2.9 2-2.9 1.6 0 1.9.5 1.4 3.2zM38 34.9c0 1-.6 2.3-1.2 2.8-1.3 1.1-8.8 2.7-8.8 2 0-.2.5-1.8 1.1-3.6 1-2.8 1.5-3.1 5-3.1 3.1 0 3.9.4 3.9 1.9zm6-1.3c0 .3-.5 1.4-1 2.5-.9 1.6-.7 1.9 1 1.9 1.2 0 1.8.4 1.5 1-.3.5-2 1-3.7 1-2.7 0-3-.3-2.4-2.3.3-1.2.6-2.8.6-3.5 0-.6.9-1.2 2-1.2s2 .3 2 .6zM36.5 41c-1 1.6-7.5 2.3-9.8 1.1-2.1-1.1-2.1-1.1.3-.7 1.4.3 3.9.1 5.5-.3 4.1-1.2 4.7-1.3 4-.1z"
          // d="M14.683 14.828a4.055 4.055 0 0 1-1.272.858a4.002 4.002 0 0 1-4.875-1.45l-1.658 1.119a6.063 6.063 0 0 0 1.621 1.62a5.963 5.963 0 0 0 2.148.903a6.035 6.035 0 0 0 3.542-.35a6.048 6.048 0 0 0 1.907-1.284c.272-.271.52-.571.734-.889l-1.658-1.119a4.147 4.147 0 0 1-.489.592z M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10s10-4.486 10-10S17.514 2 12 2zm0 2c2.953 0 5.531 1.613 6.918 4H5.082C6.469 5.613 9.047 4 12 4zm0 16c-4.411 0-8-3.589-8-8c0-.691.098-1.359.264-2H5v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1h.736c.166.641.264 1.309.264 2c0 4.411-3.589 8-8 8z"
        />
      </svg>
      <span style={{ marginLeft: '.4em', fontWeight: 800 }}>
        WPL-RC Knowledge Base
      </span>
    </>
  ),
  logoLink: 'https://github.com/another-ai/chat-gpt-powered-nextra',
  project: {
    link: 'https://github.com/another-ai/chat-gpt-powered-nextra',
  },
  chat: {
    link: 'https://discord.gg/DYE6VFTJET',
  },
  docsRepositoryBase: 'https://github.com/another-ai/chat-gpt-powered-nextra',
  footer: {
    text: 'ChatGPT-powered QA documentation Template',
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
    useLink() {
      const config = useConfig()
      return `https://github.com/different-ai/chat-gpt-powered-nextra/issues/new?title=${encodeURIComponent(
        `Feedback for "${config.title}"`
        
      )}`
    }
  },
  editLink: {
    text: 'Edit this page on GitHub →'
  },
  sidebar: {
    defaultMenuCollapseLevel: 1
  },	
  search: {
    component: <SearchModal />
  }
}

export default config
