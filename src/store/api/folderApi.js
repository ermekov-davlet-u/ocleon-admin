import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery'; // используем твой базовый квери

export const folderApi = createApi({
    reducerPath: 'folderApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Folder'],
    endpoints: (builder) => ({
        getFolders: builder.query({
            query: () => '/folder',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((f) => ({ type: 'Folder', id: f.id })),
                        { type: 'Folder', id: 'LIST' },
                    ]
                    : [{ type: 'Folder', id: 'LIST' }],
        }),
        getFolder: builder.query({
            query: (id) => `/folder/${id}`,
            providesTags: (_res, _err, id) => [{ type: 'Folder', id }],
        }),
        createFolder: builder.mutation({
            query: (body) => ({
                url: '/folder',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Folder', id: 'LIST' }],
        }),
        syncFolders: builder.mutation({
            query: () => ({
                url: '/folder/syncfolder',
                method: 'GET', // В контроллере прописан @Get
            }),
            invalidatesTags: [{ type: 'Folder', id: 'LIST' }], // Перезапросит весь список папок
        }),
        updateFolder: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/folder/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_res, _err, { id }) => [{ type: 'Folder', id }, { type: 'Folder', id: 'LIST' }],
        }),
        deleteFolder: builder.mutation({
            query: (id) => ({
                url: `/folder/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Folder', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetFoldersQuery,
    useGetFolderQuery,
    useCreateFolderMutation,
    useSyncFoldersMutation,
    useUpdateFolderMutation,
    useDeleteFolderMutation,
} = folderApi;