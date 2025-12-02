import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Signin from "./components/signin";
import Signup from "./components/signup";
import Home from "./components/home";
import Voting from "./components/voting";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/signin',
    element: <Signin />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/voting/:poll',
    element: <Voting />
  }
]);

function App(){
  return <RouterProvider router={router} />
}

export default App;