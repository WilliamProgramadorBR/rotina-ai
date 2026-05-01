import "@fastify/jwt"

declare module "@fastify/jwt"{
    interface fastifyJWT{
        user:{
            sub:string;
            email: string;
        };
    }
}