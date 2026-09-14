import mongoose from "mongoose";

import { Event } from "../models/event.model.js";

export const authorizeEventOwnerOrAdmin = async (req, res, next) => {
    try {
        const eventId = req.params.id;

        if (!mongoose.isValidObjectId(eventId)) {
            return res.status(400).json({
                status: "error",
                message: "ID de evento inválido"
            });
        }

        const event = await Event.findById(eventId);

        if(!event) {
            return res.status(404).json({
                status: "error",
                message: "Evento no encontrado"
            });
        }
        const role = req.user.role;
        const isAdmin = role === "admin";
        const isOwner = event.organizer?.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                status: "error",
                message: "Acceso denegado"
            });
        }
        req.event = event;
        next();
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error interno del servidor"
        });
    }
}
