// Canister code for Movie Tickets
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type MovieTicket = Record<{
  id: string;
  movie: string;
  seat: nat64;
  reserved: boolean;
  createdAt: nat64;
}>;

type TicketPayload = Record<{
  movie: string;
  seat: nat64;
}>;

const ticketStorage = new StableBTreeMap<string, MovieTicket>(0, 44, 1024);

// Error Messages
// const ERRORS = {
//   EMPTY_MOVIE_NAME: "Movie name cannot be empty.",
//   INVALID_SEAT: "Invalid seat number.",
//   TICKET_ALREADY_RESERVED: "This ticket is already reserved.",
//   TICKET_NOT_FOUND: (id: string) => `Ticket with id=${id} not found.`,
//   TICKET_DOES_NOT_EXIST: (id: string) => `Ticket with id=${id} does not exist.`,
// };

$query;
export function getAllTickets(): Result<Vec<MovieTicket>, string> {
  try {
    return Result.Ok(ticketStorage.values());
  } catch (error) {
    return Result.Err(`An error occurred while retrieving tickets: ${error}`);
  }
}

$query;
export function getTicket(id: string): Result<MovieTicket, string> {
  try {
    const ticket = ticketStorage.get(id);
    return match(ticket, {
      Some: (ticket) => Result.Ok<MovieTicket, string>(ticket),
      None: () =>
        Result.Err<MovieTicket, string>(`MovieTicket with id=${id} not found`),
    });
  } catch (error) {
    return Result.Err<MovieTicket, string>(
      `Error retrieving MovieTicket with id=${id}: ${error}`
    );
  }
}

$update;
export function addTicket(payload: TicketPayload): Result<MovieTicket, string> {
  // Validate the payload before processing it
  if (!payload.movie || !payload.seat) {
    return Result.Err<MovieTicket, string>("Invalid payload");
  }

  const newTicket: MovieTicket = {
    id: uuidv4(),
    movie: payload.movie,
    seat: payload.seat,
    reserved: false,
    createdAt: ic.time(),
  };

  try {
    ticketStorage.insert(newTicket.id, newTicket);
    return Result.Ok(newTicket);
  } catch (error) {
    return Result.Err(`Failed to insert newTicket: ${error}`);
  }
}

$update;
export function reserveTicket(id: string): Result<MovieTicket, string> {
  return match(ticketStorage.get(id), {
    Some: (ticket) => {
      const ticketToReserve: MovieTicket = { ...ticket };
      if (ticketToReserve.reserved)
        return Result.Err<MovieTicket, string>(
          `Ticket with placement ${ticketToReserve.reserved} is already reserved.`
        );
      else {
        const reserveTicket: MovieTicket = { ...ticket, reserved: true };
        return Result.Ok<MovieTicket, string>(reserveTicket);
      }
    },
    None: () =>
      Result.Err<MovieTicket, string>(`ticket with id=${id} does not exist.`),
  });
}

$update;
export function deleteTicket(id: string): Result<MovieTicket, string> {
  return match(ticketStorage.remove(id), {
    Some: (removeTicket) => Result.Ok<MovieTicket, string>(removeTicket),
    None: () =>
      Result.Err<MovieTicket, string>(`ticket with id=${id} does not exist.`),
  });
}

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
