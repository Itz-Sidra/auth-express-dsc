import argon2 from "argon2";

export const hash = async (password: string) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 2,
  });
};

export const verifyPassword = async (password: string, storedHash: string) => {
  return await argon2.verify(storedHash, password);
};
