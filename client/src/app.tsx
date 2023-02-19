import React from 'react';
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { Index } from './routes';
import { Notebook } from './routes/notebook';

const router = createHashRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "notebook/:id",
    element: <Notebook />,
  },
]);

export interface AppProps { }

export const App: React.FC<AppProps> = () => {
  return (
    <RouterProvider router={router} />
  );
};
