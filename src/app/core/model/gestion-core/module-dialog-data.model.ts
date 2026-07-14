import { Module } from "./module.model";

export interface DialogData {
  mode: 'create' | 'edit';
  module?: Module;
}