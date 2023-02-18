import type React from 'react'
import { classes } from '../app.st.css';
import { Header } from '../header';

export interface IndexProps { }

export const Index: React.FC<IndexProps> = () => {
    return (
        <main>
            <Header className={classes.header} />
        </main>


    )
}
