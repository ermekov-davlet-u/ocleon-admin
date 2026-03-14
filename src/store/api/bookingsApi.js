import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const bookingsApi = createApi({
    reducerPath: "bookingsApi",
    baseQuery: baseQueryWithReauth,
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