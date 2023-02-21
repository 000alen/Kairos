import React, { createContext, useMemo } from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource, getIdeas, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, saveNotebook, startLiveSource as _startLiveSource, stopLiveSource as _stopLiveSource, renameNotebook, notebookChat, getEvents, getName, getSources, getLiveSources, getConversation, getGenerations, getContent, getRunningLiveSources } from '../api';
import { Generation, INotebookContext, Message, Source } from '../typings';
import { Tiptap } from '../components/Tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { FloatButton, Layout, Tooltip, Typography, notification } from 'antd';
import { AudioOutlined, MessageOutlined, SaveOutlined } from '@ant-design/icons';
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import Document from '@tiptap/extension-document'

import { ChatDrawer } from '../components/ChatDrawer';
import { SourcesDrawer } from '../components/SourcesDrawer';
import { LiveSourcesDrawer } from '../components/LiveSourcesDrawer';
import { GenerationsDrawer } from '../components/GenerationsDrawer';

const { Title } = Typography;
const { Header, Content } = Layout;

export const NotebookContext = createContext<INotebookContext | null>(null);

const ydoc = new Y.Doc()

export const Notebook = () => {
  const { id } = useParams();
  const [api, contextHolder] = notification.useNotification();

  const editor = useEditor({
    extensions: [
      Document,
      StarterKit.configure({
        history: false
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      Collaboration.configure({
        document: ydoc
      })
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none mx-auto',
      },
    },
  })

  const [ready, setReady] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [_name, _setName] = useState<string>('');
  const [sources, setSources] = useState<Source[]>([]);
  const [liveSources, setLiveSources] = useState<Source[]>([]);
  const [runningLiveSources, setRunningLiveSources] = useState<string[]>([]);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false);
  const [liveSourcesDrawerOpen, setLiveSourcesDrawerOpen] = useState(false);
  const [generationsDrawerOpen, setGenerationsDrawerOpen] = useState(false);

  const fetchName = useCallback(async () => {
    const name = await getName(id!);
    setName(name);
  }, [setName, id]);

  const fetchSources = useCallback(async () => {
    const sources = await getSources(id!);
    setSources(sources);
  }, [setSources, id]);

  const fetchLiveSources = useCallback(async () => {
    const [sources, running] = await Promise.all([getLiveSources(id!), getRunningLiveSources(id!)])
    setRunningLiveSources(running)
    setLiveSources(sources);
  }, [setLiveSources, id]);

  const fetchConversation = useCallback(async () => {
    const conversation = await getConversation(id!);
    setConversation(conversation);
  }, [setConversation, id]);

  const fetchGenerations = useCallback(async () => {
    const generations = await getGenerations(id!);
    setGenerations(generations);
  }, [setGenerations, id]);

  const initialize = useCallback(async () => {
    fetchName();
    fetchSources();
    fetchLiveSources();
    fetchConversation();
    fetchGenerations();

    const content = await getContent(id!);
    if (content) editor?.chain().setContent(content).run();

    setReady(true);
  }, [id, setReady, editor, fetchName, fetchSources, fetchLiveSources, fetchConversation, fetchGenerations])

  const rename = useCallback(async (name: string) => {
    await renameNotebook(id!, name);
    fetchName();
  }, [id])

  const startLiveSource = useCallback(async (origin: string) => {
    const response = await _startLiveSource(id!, "sound", origin);
    fetchLiveSources();
    return response;
  }, [id])

  const stopLiveSource = useCallback(async (origin: string) => {
    await _stopLiveSource(id!, origin);
    fetchLiveSources();
  }, [id])

  const run = useCallback(async (prompt: string) => {
    const response = await joinJob(await notebookRun(id!, editor!.getText(), prompt), () => { });
    const selection = editor!.view.state.selection;
    editor!.chain().focus().insertContentAt({
      from: selection.from,
      to: selection.to
    }, response).run();
    fetchGenerations();
  }, [id, editor])

  const generate = useCallback(async (prompt: string) => {
    const response = await joinJob(await notebookGenerate(id!, editor!.getText(), prompt), () => { });
    editor!.chain().focus().insertContent(response).run();
    fetchGenerations();
  }, [id, editor])

  const edit = useCallback(async (text: string, prompt: string) => {
    const response = await joinJob(await notebookEdit(id!, editor!.getText(), text, prompt), () => { });
    const selection = editor!.view.state.selection;
    editor!.chain().focus().insertContentAt({
      from: selection.from,
      to: selection.to
    }, response).run();
    fetchGenerations();
  }, [id, editor])

  const chat = useCallback(async (prompt: string) => {
    const response = await joinJob(await notebookChat(id!, prompt), () => { });
    fetchConversation();
    return response;
  }, [id])

  const ideas = useCallback(async () => {
    const responses: string[] = await joinJob(await getIdeas(id!, editor!.getText()), () => { });
    responses.forEach((response) => {
      editor!.chain().focus().insertContent(`${response}\n`).run();
    });
    fetchGenerations();
  }, [id, editor])

  const onAdd = useCallback(async (type: string, origin: string) => {
    const response = await joinJob(await addSource(id!, type, origin), () => { });
    return response;
  }, [id])

  const addPdf = useCallback(async (origin: string) => {
    await onAdd("pdf", origin);
    fetchSources();
  }, [onAdd])

  const addYoutube = useCallback(async (origin: string) => {
    await onAdd("youtube", origin);
    fetchSources();
  }, [onAdd])

  const addWeb = useCallback(async (origin: string) => {
    await onAdd("web", origin);
    fetchSources();
  }, [onAdd])

  const sourceSummary = useCallback(async (sourceId: string) => {
    const response = await joinJob(await getSourceSummary(id!, sourceId), () => { });
    editor!.chain().focus().insertContent(response).run();
    fetchGenerations();
  }, [id, editor])

  const liveSourceSummary = useCallback(async (sourceId: string) => {
    const response = await joinJob(await getSourceSummary(id!, sourceId), () => { });
    editor!.chain().focus().insertContent(response).run();
    fetchGenerations();
  }, [id, editor])

  const save = useCallback(async () => {
    const content = editor!.getJSON();
    await joinJob(await saveNotebook(id!, content), () => { });
  }, [id, editor]);

  const context = useMemo(() => ({
    id: id!,
    name,
    sources,
    liveSources,
    runningLiveSources,
    conversation,
    generations,

    rename,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    chat,
    ideas,
    addPdf,
    addYoutube,
    addWeb,
    sourceSummary,
    liveSourceSummary,
    save,
  }), [
    id,
    name,
    sources,
    liveSources,
    runningLiveSources,
    conversation,
    generations,

    rename,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    chat,
    ideas,
    addPdf,
    addYoutube,
    addWeb,
    sourceSummary,
    liveSourceSummary,
    save,
  ])

  useEffect(() => { initialize() }, [initialize])

  useEffect(() => {
    const events = getEvents(id!);

    events.addEventListener('ping', (event) => {
      api.info({
        message: "title",
        description: 'event',
        placement: 'topRight',
      })
    });

    return () => {
      events.close();
    }
  }, [api, id])

  return (
    ready ?
      <NotebookContext.Provider value={context}>
        {contextHolder}

        <Layout
          className='h-full'
        >
          <Header style={{ position: 'sticky', display: "flex", top: 0, zIndex: 1, width: '100%', alignItems: "center", backgroundColor: "transparent" }}>
            <Title editable={{
              onChange: _setName,
              onEnd: () => rename(_name),
              tooltip: 'Click to rename',
            }} level={3} style={{ margin: 0 }}>{name}</Title>
          </Header>

          <Layout>
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                overflow: 'auto',
              }}
            >
              <Tiptap editor={editor!} />
            </Content>

            <FloatButton.Group shape="square" style={{ left: 24 }}>
              <Tooltip placement='right' title="Live sources">
                <FloatButton onClick={() => setGenerationsDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Live sources">
                <FloatButton icon={<AudioOutlined />} onClick={() => setLiveSourcesDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Sources">
                <FloatButton onClick={() => setSourcesDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Chat">
                <FloatButton icon={<MessageOutlined />} onClick={() => setChatDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Save">
                <FloatButton icon={<SaveOutlined />} onClick={save} />
              </Tooltip>
            </FloatButton.Group>
          </Layout>
        </Layout>

        <GenerationsDrawer open={generationsDrawerOpen} setOpen={setGenerationsDrawerOpen} />

        <ChatDrawer open={chatDrawerOpen} setOpen={setChatDrawerOpen} />

        <SourcesDrawer open={sourcesDrawerOpen} setOpen={setSourcesDrawerOpen} />

        <LiveSourcesDrawer open={liveSourcesDrawerOpen} setOpen={setLiveSourcesDrawerOpen} />
      </NotebookContext.Provider>
      : null
  )
}
