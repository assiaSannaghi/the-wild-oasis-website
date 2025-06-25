"use server"

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

export async function updateGuest(formData) {
    const session = await auth();

    if (!session) throw new Error("You must be signed in to update your profile.");

    const nationalID = formData.get("nationalID");
    const [nationality, countryFlag] = formData.get("nationality").split("%");

    if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID)) throw new Error("Please provide a valid national ID (6-12 alphanumeric characters).")

    const updateData = { nationality, countryFlag, nationalID };

    const { data, error } = await supabase
        .from('guests')
        .update(updateData)
        .eq('id', session.user.guestId)

    if (error) throw new Error('Guest could not be updated');

    revalidatePath("/account/profile");

}

export async function createBooking(bookingData, formData) {
    const session = await auth();
    if (!session) throw new Error("You must be signed in to update your profile.");

    const newBooking = {
        ...bookingData,
        guestId: session.user.guestId,
        numGuests: Number(formData.get("numGuests")),
        observations: formData.get("observations").slice(0, 1000),
        extrasPrice: 0,
        totalPrice: bookingData.cabinPrice,
        isPaid: false,
        hasBreakfast: false,
        status: "unconfirmed"
    }

    const { error } = await supabase
        .from('bookings')
        .insert([newBooking])

    if (error) throw new Error('Booking could not be created');

    revalidatePath(`/cabin/${bookingData.cabinId}`);
    redirect("/cabins/thankyou")
}

export async function deleteBooking(bookingId) {
    const session = await auth();
    if (!session) throw new Error("You must be signed in to update your profile.");

    const guestBookings = await getBookings(session.user.guestId);
    const guestBookingsIds = guestBookings.map(booking => booking.id);
    if (!guestBookingsIds.includes(bookingId)) throw new Error("You can only delete your own bookings.");

    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

    if (error) throw new Error('Booking could not be deleted');

    revalidatePath("/account/reservations");
}

export async function updateBooking(formData) {
    const bookingId = Number(formData.get("bookingId"));

    // 1. authentication
    const session = await auth();
    if (!session) throw new Error("You must be signed in to update your profile.");

    // 2. authorisation
    const guestBookings = await getBookings(session.user.guestId);
    const guestBookingsIds = guestBookings.map(booking => booking.id);
    if (!guestBookingsIds.includes(bookingId)) throw new Error("You can only update your own bookings.");

    // 3.building updated data
    const updatedData = {
        numGuests: Number(formData.get("numGuests")), observations: formData.get("observations").slice(0, 1000)
    };

    // 4. mutation
    const { error } = await supabase
        .from('bookings')
        .update(updatedData)
        .eq('id', bookingId).select().single()

    // 5. error handling
    if (error) throw new Error('Booking could not be updated');

    // 6. revalidation  
    revalidatePath("/account/reservations");
    revalidatePath(`/account/reservations/edit/${bookingId}`);

    // 7.redection
    redirect("/account/reservations")
}

export async function signInAction() {
    await signIn("google", { redirectTo: "/account" })
}

export async function signOutAction() {
    await signOut({ redirectTo: "/" })
}