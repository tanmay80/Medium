import { Hono } from 'hono'
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'

//Need to specify the generic for environment variable for TS to work or can use TSignore thing
//Since there is a env variable of DATABASE_URL we are telling to hono here that we have env variable 
//DATABASE_URL of string type for TS to not give an error.
export const userRouter=new Hono<{
    Bindings:{
        DATABASE_URL:string,
        JWT_SECRET:string
    }
}>();

userRouter.post('/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());
	const body = await c.req.json();
	try {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password
        }
      });
      
      const token = await sign({id:user.id}, c.env?.JWT_SECRET);
      return c.json({token});
	} catch(e) {
      c.status(403);
      return c.json({ error: "error while signing up" });
	}
})

userRouter.post('/signin', async (c) =>{ 
  const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

  const body= await c.req.json();

  try{
    const user=await prisma.user.findUnique({
      where:{
        email:body.email,
        password:body.password
      }
    });
  
    if(!user){
      c.status(403);
      return c.json({error: "error while signing up"});
    }

    const jwt = await sign({ id: user.id }, c.env?.JWT_SECRET);
    return c.json({ jwt });

  }catch(e) {
    c.status(403);
    return c.json({ error: "error while signing up" });
  }

});