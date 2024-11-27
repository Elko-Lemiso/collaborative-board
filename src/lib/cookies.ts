
import { cookies } from "next/headers";

export const getUsernameFromCookies = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value;
  return username || null;
};
