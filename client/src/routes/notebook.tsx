import type React from 'react'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addSource, getIdeas, getNotebook, getSourceSummary, joinJob, notebookEdit, notebookGenerate, notebookRun, startLiveSource, stopLiveSource } from '../api';
import type { Notebook as INotebook } from '../typings';

export interface NotebookProps { }

export const Notebook: React.FC<NotebookProps> = () => {
    const { id } = useParams();

    const [ready, setReady] = useState<boolean>(false);
    const [notebook, setNotebook] = useState<INotebook | null>(null);
    const [command, setCommand] = useState<string>("");

    const onChangeCommand = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setCommand(e.target.value)
        , [setCommand])

    const initialize = useCallback(async () => {
        const notebook = await getNotebook(id!);
        setNotebook(notebook);
        setReady(true);
    }, [setNotebook, setReady])

    useEffect(() => { initialize() }, [])

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
    }, [id, command])

    const onAddYoutube = useCallback(async () => {
        const response = await onAdd("youtube", command);
        console.log(response);
    }, [id, command])

    const onAddWeb = useCallback(async () => {
        const response = await onAdd("web", command);
        console.log(response);
    }, [id, command])

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

    return (
        ready ?
            <main>
                <h1>{notebook!.name}</h1>

                <div>
                    <h2>Sources</h2>
                    <ul>
                        {notebook!.sources.map((source) => (
                            <li key={source.origin}>
                                <button onClick={() => onSourceSummary(source.id)}>Summary</button>
                                {source.type}: {source.origin}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2>Live sources</h2>
                    <ul>
                        {notebook!.live_sources.map((source) => (
                            <li key={source.origin}>
                                <button onClick={() => onLiveSourceSummary(source.id)}>Summary</button>
                                {source.type}: {source.origin}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>{notebook!.content}</div>

                <div>
                    <h2>Commands</h2>
                    <input type="text" value={command} onChange={onChangeCommand} placeholder='Command' />

                    <div>
                        <button onClick={onRun}>Run</button>
                        <button onClick={onGenerate}>Generate</button>
                        <button onClick={onEdit}>Edit</button>
                        <button onClick={onIdeas}>Ideas</button>
                        <button onClick={onAddPdf}>Add PDF</button>
                        <button onClick={onAddYoutube}>Add Youtube</button>
                        <button onClick={onAddWeb}>Add Web</button>
                        <button onClick={onStartLiveSource}>Start live source</button>
                        <button onClick={onStopLiveSource}>Stop live source</button>
                    </div>
                </div>
            </main> : null
    )
}
