import { combineSlices, configureStore } from '@reduxjs/toolkit'

// Add feature slices here as they are implemented.
const rootReducer = combineSlices()

export const store = configureStore({
  reducer: rootReducer,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
