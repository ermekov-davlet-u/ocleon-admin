import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const fileApi = createApi({
    reducerPath: 'fileApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['File'],
    endpoints: (builder) => ({
        // Получение папок (Твой оригинальный путь)
        getFolders: builder.query({
            query: () => '/folder',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((f) => ({ type: 'File', id: f.id })),
                        { type: 'File', id: 'LIST' },
                    ]
                    : [{ type: 'File', id: 'LIST' }],
        }),

        // Получение конкретной папки
        getFolder: builder.query({
            query: (id) => `/folder/${id}`,
            providesTags: (_res, _err, id) => [{ type: 'File', id }],
        }),

        // Создание папки (Твой оригинальный путь)
        createFolder: builder.mutation({
            query: (body) => ({
                url: '/folder',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'File', id: 'LIST' }],
        }),

        // Обновление папки
        updateFolder: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/folder/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_res, _err, { id }) => [{ type: 'File', id }, { type: 'File', id: 'LIST' }],
        }),

        // Удаление папки
        deleteFolder: builder.mutation({
            query: (id) => ({
                url: `/folder/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'File', id: 'LIST' }],
        }),

        // Синхронизация папок (Твой оригинальный метод GET и путь /syncfolder)
        syncFolders: builder.mutation({
            query: () => ({
                url: '/folder/syncfolder',
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'File', id: 'LIST' }],
        }),

        // Новый эндпоинт для загрузки файлов (принимает FormData)
        uploadFile: builder.mutation({
            query: (formData) => ({
                url: '/file/upload',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: [{ type: 'File', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetFoldersQuery,
    useGetFolderQuery,
    useCreateFolderMutation,
    useUpdateFolderMutation,
    useDeleteFolderMutation,
    useUploadFileMutation,
    useSyncFoldersMutation,
} = fileApi;