// Canister code for Movie Tickets
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type MovieTicket = Record<{
    id: string;
    movie: string;
    seat: nat64;
    reserved: boolean;
    createdAt: nat64;
}>;

const ticketStorage = new StableBTreeMap<string, MovieTicket>(0, 44, 1024);

// Error Messages
const ERRORS = {
    EMPTY_MOVIE_NAME: 'Movie name cannot be empty.',
    INVALID_SEAT: 'Invalid seat number.',
    TICKET_NOT_FOUND: (id: string) => `Ticket with id=${id} not found.`,
    TICKET_ALREADY_RESERVED: 'This ticket is already reserved.',
    TICKET_DOES_NOT_EXIST: (id: string) => `Ticket with id=${id} does not exist.`,
};

$query;
export function getAllTickets(): Result<Vec<MovieTicket>, string> {
    return Result.Ok(ticketStorage.values());
}

$query;
export function getTicket(id: string): Result<MovieTicket, string> {
    const ticket = ticketStorage.get(id);
    if (ticket !== null) {
        return Result.Ok(ticket);
    } else {
        return Result.Err(ERRORS.TICKET_NOT_FOUND(id));
    }
}

$update;
export function addTicket(movie: string, seat: nat64): Result<MovieTicket, string> {
    // Generate a cryptographically secure UUID
    const newTicketId: string = uuidv4();

    // Validate inputs
    if (movie.trim() === '') {
        return Result.Err(ERRORS.EMPTY_MOVIE_NAME);
    }
    if (seat <= 0) {
        return Result.Err(ERRORS.INVALID_SEAT);
    }

    const newTicket: MovieTicket = { 
        id: newTicketId, 
        movie: movie,
        seat: seat, 
        reserved: false, 
        createdAt: ic.time() 
    };
    ticketStorage.insert(newTicket.id, newTicket);
    return Result.Ok(newTicket);
}

$update;
export function reserveTicket(id: string): Result<MovieTicket, string> {
    const ticket = ticketStorage.get(id);
    if (ticket !== null) {
        if (ticket.reserved) {
            return Result.Err(ERRORS.TICKET_ALREADY_RESERVED);
        }
        const reservedTicket: MovieTicket = { ...ticket, reserved: true };
        ticketStorage.insert(ticket.id, reservedTicket);
        return Result.Ok(reservedTicket);
    } else {
        return Result.Err(ERRORS.TICKET_DOES_NOT_EXIST(id));
    }
}

$update;
export function deleteTicket(id: string): Result<MovieTicket, string> {
    const deletedTicket = ticketStorage.remove(id);
    if (deletedTicket !== null) {
        return Result.Ok(deletedTicket);
    } else {
        return Result.Err(ERRORS.TICKET_DOES_NOT_EXIST(id));
    }
}
