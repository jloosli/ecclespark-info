import { decodeJwtResponse } from "./utils";
import params from "@params";

const handleGoogleLogInResponse = (
  response: google.accounts.id.CredentialResponse
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (response.credential) {
      resolve(decodeJwtResponse(response.credential));
    } else {
      reject("No credential found");
    }
  });
};

const initialize = () =>
  new Promise((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: params.CLIENT_ID,
      callback: (response) => resolve(handleGoogleLogInResponse(response)),
      auto_select: true,
    });
  });

const renderLoginButtion = (ref: HTMLElement): void => {
  google.accounts.id.renderButton(ref, { type: "standard", theme: "outline" });
};

const googlePrompt = () => google.accounts.id.prompt();

export {
  handleGoogleLogInResponse,
  renderLoginButtion,
  initialize,
  googlePrompt,
};
