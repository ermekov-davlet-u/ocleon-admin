import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const invoiceApi = createApi({
    reducerPath: 'invoiceApi',
    baseQuery: baseQueryWithReauth,
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
