import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { message } from "antd";
import { mainURL } from "../../config";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: mainURL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    localStorage.removeItem("token");
    message.error("Сессия истекла, войдите снова");

    // Перенаправляем на корень, где App покажет страницу логина
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    } else {
      // Если уже на корне, просто перезагрузим приложение
      window.location.reload();
    }
  }

  return result;
};

