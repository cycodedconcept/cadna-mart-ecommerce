import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadCatalogue } from "./data";
import type { Category, Product } from "./types";

export const fetchCatalogue = createAsyncThunk("catalogue/load", loadCatalogue);
interface CatalogueState {
  products: Product[];
  categories: Category[];
  status: "idle" | "loading" | "ready" | "error";
}
const initialState: CatalogueState = {
  products: [],
  categories: [],
  status: "idle",
};
export const catalogueSlice = createSlice({
  name: "catalogue",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchCatalogue.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCatalogue.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = "ready";
      })
      .addCase(fetchCatalogue.rejected, (state) => {
        state.status = "error";
      }),
});
