import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mainURL } from '../../config';

export const invoiceApi = createApi({
    reducerPath: 'invoiceApi',
    baseQuery: fetchBaseQuery({ baseUrl: mainURL }),
    tagTypes: ['invoice'],
    endpoints: (builder) => ({
        getInvoices: builder.query({
            query: () => '/invoices',
            providesTags: ['invoice'],
        }),
        createInvoice: builder.mutation({
            query: (body) => ({
                url: '/invoices',
                method: 'POST',
                body,
            }),
        })
    }),
});

export const {
    useGetInvoicesQuery,
    useCreateInvoiceMutation
} = invoiceApi;
