import { ArkError } from "arktype";

function formatArkError(err: ArkError) {
   return {
      field: err.path.join("."),
      message: err.message,
      code: err.code,
   };
}

export { formatArkError };
