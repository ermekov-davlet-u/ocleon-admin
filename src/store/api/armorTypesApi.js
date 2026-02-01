// store/api/armorTypesApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const armorTypesApi = createApi({
  reducerPath: "armorTypesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/" }),
  tagTypes: ["ArmorType"],
  endpoints: (builder) => ({
    getArmorTypes: builder.query({
      query: () => "armor-film-types",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "ArmorType", id })), { type: "ArmorType", id: "LIST" }]
          : [{ type: "ArmorType", id: "LIST" }],
    }),
    createArmorType: builder.mutation({
      query: (body) => ({
        url: "armor-film-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ArmorType", id: "LIST" }],
    }),
    updateArmorType: builder.mutation({
      query: ({ id, data }) => ({
        url: `armor-film-types/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ArmorType", id }],
    }),
    deleteArmorType: builder.mutation({
      query: (id) => ({
        url: `armor-film-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ArmorType", id: "LIST" }],
    }),
  }),
});

export const {
  useGetArmorTypesQuery,
  useCreateArmorTypeMutation,
  useUpdateArmorTypeMutation,
  useDeleteArmorTypeMutation,
} = armorTypesApi;
