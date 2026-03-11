import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { mainURL } from "../../config";

export const bookingsApi = createApi({
    reducerPath: "bookingsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: mainURL,
        prepareHeaders: (headers) => {
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["Bookings"],
    endpoints: (builder) => ({
        getBookings: builder.query({
            query: (params) => ({
                url: "bookings",
                params,
            }),
            providesTags: ["Bookings"],
        }),

        getBookingById: builder.query({
            query: (id) => `bookings/${id}`,
            providesTags: ["Bookings"],
        }),

        updateBooking: builder.mutation({
            query: ({ id, body }) => ({
                url: `bookings/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Bookings"],
        }),

        deleteBooking: builder.mutation({
            query: (id) => ({
                url: `bookings/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Bookings"],
        }),

        getBusySlots: builder.query({
            query: (date) => ({
                url: "bookings/busy-slots",
                params: { date },
            }),
        }),
    }),
});

export const {
    useGetBookingsQuery,
    useGetBookingByIdQuery,
    useUpdateBookingMutation,
    useDeleteBookingMutation,
    useGetBusySlotsQuery,
} = bookingsApi;