import React from 'react';
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import { Index } from './routes';
import { Notebook } from './routes/notebook';
import { Error } from './routes/error';

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

export const App = () => {
  return (
    <RouterProvider router={router} fallbackElement={<Error />} />
  );
};
