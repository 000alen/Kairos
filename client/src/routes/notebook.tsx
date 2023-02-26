import React, { createContext, useMemo, useRef } from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource as _addSource, getIdeas, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, saveNotebook, startLiveSource as _startLiveSource, stopLiveSource as _stopLiveSource, renameNotebook, notebookChat, getEvents, getName, getSources, getLiveSources, getConversation, getGenerations, getContent, getRunningLiveSources, getJobs, getPCA } from '../api';
import { Generation, INotebookContext, Job, Message, Source, XYT } from '../typings';
import { Tiptap } from '../components/Tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { Carousel, FloatButton, Layout, Tooltip, Typography, notification } from 'antd';
import { AudioOutlined, MessageOutlined, SaveOutlined } from '@ant-design/icons';
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import Popup from '../popup-menu'
import Document from '@tiptap/extension-document'
import * as Y from 'yjs'
import { ChatDrawer } from '../components/drawers/ChatDrawer';
import { SourcesDrawer } from '../components/drawers/SourcesDrawer';
import { LiveSourcesDrawer } from '../components/drawers/LiveSourcesDrawer';
import { GenerationsDrawer } from '../components/drawers/GenerationsDrawer';
import { JobsDrawer } from '../components/drawers/JobsDrawer';
import Dots from '../components/Dots';
import ParentSize from '@visx/responsive/lib/components/ParentSize';

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
      Popup,
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pca, setPCA] = useState<XYT[]>([]);

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false);
  const [liveSourcesDrawerOpen, setLiveSourcesDrawerOpen] = useState(false);
  const [generationsDrawerOpen, setGenerationsDrawerOpen] = useState(false);
  const [jobsDrawerOpen, setJobsDrawerOpen] = useState(false);

  const [popupShown, setPopupShown] = useState<boolean>(false);
  const [popupTitle, setPopupTitle] = useState<string | null>(null);
  const [popupDescription, setPopupDescription] = useState<string | null>(null);

  const insert = useCallback(async (text: string) => {
    editor!.chain().focus().insertContent(text).run();
  }, [editor]);

  const insertAt = useCallback(async (text: string, from: number, to: number) => {
    editor!.chain()
      .focus()
      .insertContentAt({ from, to }, text)
      .run();
  }, [editor]);

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

  const fetchJobs = useCallback(async () => {
    const jobs = await getJobs(id!);
    setJobs(jobs);
  }, [setJobs, id]);

  const fetchPCA = useCallback(async () => {
    const pca = await getPCA(id!);
    setPCA(pca);
  }, [setPCA, id]);

  const rename = useCallback(async (name: string) => {
    await renameNotebook(id!, name);
    fetchName();
  }, [id, fetchName])

  const startLiveSource = useCallback(async (origin: string) => {
    const response = await _startLiveSource(id!, "sound", origin);
    fetchLiveSources();
    return response;
  }, [id, fetchLiveSources])

  const stopLiveSource = useCallback(async (origin: string) => {
    await _stopLiveSource(id!, origin);
    fetchLiveSources();
  }, [id, fetchLiveSources])

  const popup = useCallback(async (title: string, description: string) => {
    setPopupTitle(title);
    setPopupDescription(description);
    editor!.commands.showPopupMenu();
  }, [editor, setPopupTitle, setPopupDescription]);

  const run = useCallback(async (prompt: string) => {
    const { error, output } = await joinJob<string>(id!, await notebookRun(id!, editor!.getText(), prompt), () => {
    });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    popup(prompt, output!)

    fetchGenerations();
  }, [id, editor, api, fetchGenerations, popup])

  const generate = useCallback(async (prompt: string) => {
    const { error, output } = await joinJob<string>(id!, await notebookGenerate(id!, editor!.getText(), prompt), () => { });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    // insert(output!)
    popup(prompt, output!)

    fetchGenerations();
  }, [id, editor, api, fetchGenerations, insert])

  const edit = useCallback(async (text: string, prompt: string) => {
    const { error, output } = await joinJob<string>(id!, await notebookEdit(id!, editor!.getText(), text, prompt), () => { });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    popup(prompt, output!)

    fetchGenerations();
  }, [id, editor, api, fetchGenerations, insertAt])

  const chat = useCallback(async (prompt: string) => {
    const { error, output } = await joinJob<string>(id!, await notebookChat(id!, prompt), () => { });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    fetchConversation();
    return output!;
  }, [id, fetchConversation, api])

  const ideas = useCallback(async () => {
    const { error, output } = await joinJob<string[]>(id!, await getIdeas(id!, editor!.getText()), () => { });

    if (error)
      return api.error({
        message: "Oh no! Something went wrong.",
        placement: 'topRight',
      });

    // insert(output!.join("\n"));
    popup("Ideas", output!.join("\n"))

    fetchGenerations();
  }, [id, editor, api, fetchGenerations, insert])

  const addSource = useCallback(async (type: string, origin: string) => {
    const { error } = await joinJob(id!, await _addSource(id!, type, origin), () => { });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    fetchSources();
  }, [id, fetchSources, api])

  const sourceSummary = useCallback(async (sourceId: string) => {
    const { error, output } = await joinJob<string>(id!, await getSourceSummary(id!, sourceId), () => { });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    // insert(output!);
    popup("Source Summary", output!)

    fetchGenerations();
  }, [id, fetchGenerations, api, insert])

  const liveSourceSummary = useCallback(async (sourceId: string) => {
    const { error, output } = await joinJob<string>(id!, await getSourceSummary(id!, sourceId), () => { });

    if (error) return api.error({
      message: "Oh no! Something went wrong.",
      placement: 'topRight',
    });

    // insert(output!);
    popup("Live Source Summary", output!)

    fetchGenerations();
  }, [id, api, fetchGenerations, insert])

  const save = useCallback(async () => {
    const content = editor!.getJSON();
    await joinJob(id!, await saveNotebook(id!, content), () => { });
  }, [id, editor]);

  const initialize = useCallback(async () => {
    fetchName();
    fetchSources();
    fetchLiveSources();
    fetchConversation();
    fetchGenerations();
    fetchJobs();
    fetchPCA();

    const content = await getContent(id!);
    if (content) editor?.chain().setContent(content).run();

    setReady(true);
  }, [id, setReady, editor, fetchName, fetchSources, fetchLiveSources, fetchConversation, fetchGenerations, fetchJobs, fetchPCA])

  const context = useMemo(() => ({
    id: id!,
    name,
    sources,
    liveSources,
    runningLiveSources,
    conversation,
    generations,
    jobs,
    popupShown, setPopupShown,
    popupTitle,
    popupDescription,
    rename,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    chat,
    ideas,
    addSource,
    sourceSummary,
    liveSourceSummary,
    save,
    insert,
    insertAt,
  }), [
    id,
    name,
    sources,
    liveSources,
    runningLiveSources,
    conversation,
    generations,
    jobs,
    popupShown, setPopupShown,
    popupTitle,
    popupDescription,
    rename,
    startLiveSource,
    stopLiveSource,
    run,
    generate,
    edit,
    chat,
    ideas,
    addSource,
    sourceSummary,
    liveSourceSummary,
    save,
    insert,
    insertAt,
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
                overflow: 'auto',
              }}
            >
              <Carousel>
                <div className='h-[500px]'>
                  <ParentSize>
                    {({ width, height }) =>
                      <Dots width={width} height={height} xyts={pca} />
                    }
                  </ParentSize>
                </div>
              </Carousel>

              <Tiptap editor={editor!} />
            </Content>

            <FloatButton.Group shape="square" style={{ left: 24 }}>
              <Tooltip placement='right' title="Jobs">
                <FloatButton onClick={() => setJobsDrawerOpen(true)} />
              </Tooltip>

              <Tooltip placement='right' title="Generations">
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

        <JobsDrawer open={jobsDrawerOpen} setOpen={setJobsDrawerOpen} />

        <GenerationsDrawer open={generationsDrawerOpen} setOpen={setGenerationsDrawerOpen} />

        <ChatDrawer open={chatDrawerOpen} setOpen={setChatDrawerOpen} />

        <SourcesDrawer open={sourcesDrawerOpen} setOpen={setSourcesDrawerOpen} />

        <LiveSourcesDrawer open={liveSourcesDrawerOpen} setOpen={setLiveSourcesDrawerOpen} />
      </NotebookContext.Provider>
      : null
  )
}
