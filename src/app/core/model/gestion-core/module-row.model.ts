import { Module } from './module.model';

export interface ModuleRow extends Module {
  level: number;     
  isParent: boolean;  
}