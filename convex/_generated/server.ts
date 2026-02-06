/* eslint-disable */
import type { AnyRegisteredAction, AnyRegisteredMutation, AnyRegisteredQuery } from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * The type of the server.
 */
export type ServerType = {
  actions: AnyRegisteredAction;
  mutations: AnyRegisteredMutation;
  queries: AnyRegisteredQuery;
};
