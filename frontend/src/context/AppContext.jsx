import React, { createContext, useContext, useReducer } from "react";
import { api } from "../api";

const AppContext = createContext();

const initialState = {
  user: api.getCurrentUser(),
  tasksUpdatedKey: 0,
  toasts: []
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload
      };
    case "LOGOUT":
      api.logout();
      return {
        ...state,
        user: null
      };
    case "REFRESH_TASKS":
      return {
        ...state,
        tasksUpdatedKey: state.tasksUpdatedKey + 1
      };
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload)
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    dispatch({ type: "ADD_TOAST", payload: { id, message, type } });
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    }, 4000);
  };

  const loginUser = (user) => {
    dispatch({ type: "SET_USER", payload: user });
    showToast(`Вітаємо, ${user.name}!`, "success");
  };

  const logoutUser = () => {
    dispatch({ type: "LOGOUT" });
    showToast("Ви вийшли з акаунта.", "info");
  };

  const refreshTasks = () => {
    dispatch({ type: "REFRESH_TASKS" });
  };

  return (
    <AppContext.Provider
      value={{
        user: state.user,
        tasksUpdatedKey: state.tasksUpdatedKey,
        toasts: state.toasts,
        dispatch,
        showToast,
        loginUser,
        logoutUser,
        refreshTasks
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
export { AppContext };
