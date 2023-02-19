import React from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource, getIdeas, getNotebook, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, saveNotebook, startLiveSource, stopLiveSource } from '../api';
import { Notebook as INotebook } from '../typings';
import { Tiptap } from '../components/Tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { MenuProps, FloatButton, Layout, Menu, Drawer, Button } from 'antd';
import { QuestionCircleOutlined, SyncOutlined } from '@ant-design/icons';

import "../styles/notebook.css"

const { Header, Content } = Layout;

const menuItems: MenuProps['items'] = ['1', '2', '3'].map((key) => ({
  key,
  label: `nav ${key}`,
}));


export const Notebook = () => {
  const { id } = useParams();

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none mx-auto',
      },
    },
  })

  const [ready, setReady] = useState<boolean>(false);
  const [notebook, setNotebook] = useState<INotebook | null>(null);
  const [command, setCommand] = useState<string>("");

  const onChangeCommand = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
    setCommand(e.target.value)
    , [setCommand])

  const initialize = useCallback(async () => {
    const notebook = await getNotebook(id!);

    console.log(notebook.content);

    if (notebook.content) editor?.chain().setContent(notebook.content).run();

    setNotebook(notebook);
    setReady(true);
  }, [setNotebook, setReady, editor])

  useEffect(() => { initialize() }, [initialize])


  useEffect(() => {
    const sse = new EventSource('http://127.0.0.1:5000/events/test');

    sse.addEventListener("ping", (event) => {
      console.log(event.data)
    })

    return () => {
      sse.close();
    }
  }, [])

  const onStartLiveSource = useCallback(async () => {
    const response = await startLiveSource(id!, "sound", command);
    console.log(response);
  }, [id, command])

  const onStopLiveSource = useCallback(async () => {
    const response = await stopLiveSource(id!, command);
    console.log(response);
  }, [id, command])

  const onRun = useCallback(async () => {
    const response = await joinJob(await notebookRun(id!, notebook!.content, command), () => { });
    console.log(response);
  }, [id, command, notebook])

  const onGenerate = useCallback(async () => {
    const response = await joinJob(await notebookGenerate(id!, notebook!.content, command), () => { });
    console.log(response);
  }, [id, command, notebook])

  const onEdit = useCallback(async () => {
    const response = await joinJob(await notebookEdit(id!, notebook!.content, command), () => { });
    console.log(response);
  }, [id, command, notebook])

  const onIdeas = useCallback(async () => {
    const response = await joinJob(await getIdeas(id!, notebook!.content), () => { });
    console.log(response);
  }, [id, notebook])

  const onAdd = useCallback(async (type: string, origin: string) => {
    const response = await joinJob(await addSource(id!, type, origin), () => { });
    return response;
  }, [id, command])

  const onAddPdf = useCallback(async () => {
    const response = await onAdd("pdf", command);
    console.log(response);
  }, [id, command, onAdd])

  const onAddYoutube = useCallback(async () => {
    const response = await onAdd("youtube", command);
    console.log(response);
  }, [id, command, onAdd])

  const onAddWeb = useCallback(async () => {
    const response = await onAdd("web", command);
    console.log(response);
  }, [id, command, onAdd])

  const onSourceSummary = useCallback(async (sourceId: string) => {
    const lastK = command ? parseInt(command) : undefined;
    const response = await joinJob(await getSourceSummary(id!, sourceId, lastK), () => { });
    console.log(response);
  }, [id, command])

  const onLiveSourceSummary = useCallback(async (sourceId: string) => {
    const lastK = command ? parseInt(command) : undefined;
    const response = await joinJob(await getSourceSummary(id!, sourceId, lastK), () => { });
    console.log(response);
  }, [id, command])

  const onSave = useCallback(async () => {
    const content = editor!.getJSON();
    await joinJob(await saveNotebook(id!, content), () => { });
  }, [id, command, editor]);


  const [open, setOpen] = useState(false);
  const [childrenDrawer, setChildrenDrawer] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const showChildrenDrawer = () => {
    setChildrenDrawer(true);
  };

  const onChildrenDrawerClose = () => {
    setChildrenDrawer(false);
  };

  return (
    ready ?
      <>
        <Layout
          className='h-full'
        >
          <Header className="header" style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
            <div className="logo" />
            <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']} items={menuItems} />
          </Header>

          <Layout style={{ position: "relative", padding: '0 24px 24px' }}>
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
              <FloatButton icon={<QuestionCircleOutlined />} />
              <FloatButton />
              <FloatButton icon={<SyncOutlined />} onClick={showDrawer} />
            </FloatButton.Group>
          </Layout>
        </Layout>

        <Drawer title="Multi-level drawer" width={520} closable={false} onClose={onClose} open={open}>
          <Button onClick={showChildrenDrawer}>
            Two-level drawer
          </Button>
          <Drawer
            title="Two-level Drawer"
            width={320}
            closable={false}
            onClose={onChildrenDrawerClose}
            open={childrenDrawer}
          >
            This is two-level drawer
          </Drawer>
        </Drawer>
      </>
      : null

    // ready ?
    //   <div>
    //     <h1>{notebook!.name}</h1>

    //     <div>
    //       <h2>Sources</h2>
    //       <ul>
    //         {notebook!.sources.map((source) => (
    //           <li key={source.origin}>
    //             <button onClick={() => onSourceSummary(source.id)}>Summary</button>
    //             {source.type}: {source.origin}
    //           </li>
    //         ))}
    //       </ul>
    //     </div>

    //     <div>
    //       <h2>Live sources</h2>
    //       <ul>
    //         {notebook!.live_sources.map((source) => (
    //           <li key={source.origin}>
    //             <button onClick={() => onLiveSourceSummary(source.id)}>Summary</button>
    //             {source.type}: {source.origin}
    //           </li>
    //         ))}
    //       </ul>
    //     </div>

    //     <div>
    // <Tiptap editor={editor!} />
    //     </div>

    //     <div>
    //       <h2>Commands</h2>
    //       <input type="text" value={command} onChange={onChangeCommand} placeholder='Command' />

    //       <div>
    //         <button onClick={onRun}>Run</button>
    //         <button onClick={onGenerate}>Generate</button>
    //         <button onClick={onEdit}>Edit</button>
    //         <button onClick={onIdeas}>Ideas</button>
    //         <button onClick={onAddPdf}>Add PDF</button>
    //         <button onClick={onAddYoutube}>Add Youtube</button>
    //         <button onClick={onAddWeb}>Add Web</button>
    //         <button onClick={onStartLiveSource}>Start live source</button>
    //         <button onClick={onStopLiveSource}>Stop live source</button>
    //         <button onClick={onSave}>Save</button>
    //       </div>
    //     </div>
    //   </div> : null
  )
}
