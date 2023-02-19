import React from 'react'
import { useCallback, useState } from 'react'
import { createNotebook, joinJob, loadNotebook, openFile } from '../api';
import { useNavigate } from 'react-router-dom';

export const Index = () => {
    const navigate = useNavigate();

    const [apiUrl, setApiUrl] = useState<string>("http://localhost:8080");
    const [name, setName] = useState<string>("");

    const onChangeApiUrl = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setApiUrl(e.target.value)
        , [setApiUrl])

    const onChangeName = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setName(e.target.value)
        , [setName])


    const navigateToNotebook = useCallback((notebookId: string) => {
        navigate(`/notebook/${notebookId}`);
    }, [navigate])

    const onNewNotebook = useCallback(async () => {
        const notebookId = await createNotebook(
            name
        );
        navigateToNotebook(notebookId);
    }, [name, navigateToNotebook])

    const onLoadNotebook = useCallback(async () => {
        const path = await joinJob(await openFile(), () => { });
        const notebookId = await joinJob(await loadNotebook(path), () => { });
        navigateToNotebook(notebookId);
    }, [navigateToNotebook])

    return (
        <main>
            <div>
                <input type="text" value={apiUrl} onChange={onChangeApiUrl} placeholder='API url' />
            </div>

            <div>
                <input type="text" value={name} onChange={onChangeName} placeholder='Notebook name' />
                <button onClick={onNewNotebook}>New notebook</button>

            </div>

            <div>
                <button onClick={onLoadNotebook}>Load notebook</button>
            </div>
        </main>
    )
}
