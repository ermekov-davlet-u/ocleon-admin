// store/api/materialReceiptApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mainURL } from './../../config';

export const materialReceiptApi = createApi({
    reducerPath: 'materialReceiptApi',
    baseQuery: fetchBaseQuery({ baseUrl: mainURL }),
    tagTypes: ['MaterialReceipt'],
    endpoints: (builder) => ({
        getReceipts: builder.query({
            query: () => 'material-receipts',
            providesTags: ['MaterialReceipt'],
        }),
        createReceipt: builder.mutation({
            query: (body) => ({
                url: 'material-receipts',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['MaterialReceipt'],
        }),
    }),
});

export const { useGetReceiptsQuery, useCreateReceiptMutation } = materialReceiptApi;
