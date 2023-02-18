import type React from 'react'
import { useCallback, useState } from 'react'
import { createNotebook } from '../api';

export interface IndexProps { }

export const Index: React.FC<IndexProps> = () => {
    const [apiUrl, setApiUrl] = useState<string>("http://localhost:8080");
    const [name, setName] = useState<string>("");
    const [path, setPath] = useState<string>("");

    const [notebookId, setNotebookId] = useState<string | null>(null);


    const onChangeApiUrl = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setApiUrl(e.target.value)
    }, [setApiUrl])

    const onChangeName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [setName])

    const onChangePath = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPath(e.target.value)
    }, [setPath])

    const onNewNotebook = useCallback(async () => {
        const notebookId = await createNotebook(
            name
        );
        setNotebookId(notebookId);
    }, [name, setNotebookId])

    const onLoadNotebook = useCallback(async () => { }, [])

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
                <input type="text" value={path} onChange={onChangePath} placeholder='Notebook path' />
                <button onClick={onLoadNotebook}>Load notebook</button>
            </div>

            <div>
                Notebook id: {notebookId}
            </div>
        </main>
    )
}
