'use client';

import { createContext, useContext } from 'react';

type Role = 'admin' | 'viewer';

export const RoleContext = createContext<Role>('viewer');
export const useRole = () => useContext(RoleContext);
