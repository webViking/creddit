import { MyContext } from 'src/types';
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver, Query } from 'type-graphql';
import { User } from '../entities/User';
import argon2 from 'argon2';

//using as a arguments
@InputType()
class UsernamePasswordInput {
	@Field() username: string;
	@Field() password: string;
}

@ObjectType()
class FieldError {
	@Field() field: string;
	@Field() message: string;
}

//we can return from our mutations
@ObjectType()
class UserResponse {
	@Field(() => [ FieldError ], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Query(() => [ User ])
	async findAllUsers(@Ctx() { em }: MyContext): Promise<User[]> {
		const user = await em.find(User, {});
		return user;
	}

	@Mutation(() => UserResponse)
	async register(@Arg('options') options: UsernamePasswordInput, @Ctx() { em }: MyContext): Promise<UserResponse> {
		if (options.username.length <= 2) {
			return {
				errors: [
					{
						field: 'username',
						message: 'length must be greater than 2'
					}
				]
			};
		}
		if (options.password.length <= 4) {
			return {
				errors: [
					{
						field: 'password',
						message: 'length must be greater than 4'
					}
				]
			};
		}
		const hashedPassword = await argon2.hash(options.username);
		const user = em.create(User, { username: options.username, password: hashedPassword });

		try {
			await em.persistAndFlush(user);
		} catch (err) {
			if (err.code === '23505' || err.detail.includes('already exists')) {
				return {
					errors: [
						{
							field: 'username',
							message: 'username already taken'
						}
					]
				};
			}
		}
		return { user };
	}

	@Mutation(() => UserResponse)
	async login(@Arg('options') options: UsernamePasswordInput, @Ctx() { em }: MyContext): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username });
		if (!user) {
			return {
				errors: [
					{
						field: 'username',
						message: 'username is not exists'
					}
				]
			};
		}

		const validPassword = await argon2.verify(user.password, options.password);
		if (!validPassword) {
			return {
				errors: [
					{
						field: 'password',
						message: 'incorrect password or login'
					}
				]
			};
		}
		return {
			user
		};
	}
}