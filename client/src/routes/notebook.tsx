import type React from 'react'
import { useParams } from 'react-router-dom';

export interface NotebookProps { }

export const Notebook: React.FC<NotebookProps> = () => {
    const { id } = useParams();

    return (
        <main>
            Notebook {id}
        </main>
    )
}
