import { Module } from "../../core/model/dto/gestion-core/module.model";

export interface DialogData {
  mode: 'create' | 'edit';
  module?: Module;
}