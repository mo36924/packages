#!/usr/bin/env node
import { patch } from "./index";

patch().catch(console.error);
