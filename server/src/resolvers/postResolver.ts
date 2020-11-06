import { Post } from '../entities/Post';
import {
	Resolver,
	Query,
	Arg,
	Mutation,
	InputType,
	Field,
	Ctx,
	UseMiddleware,
	Int,
	FieldResolver,
	Root,
	ObjectType,
	Info
} from 'type-graphql';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';


@InputType()
class PostInput {
	@Field(() => String, { nullable: true })
	title: string;

	@Field() text: string;
}
@ObjectType()
class PaginatedPosts {
	@Field(() => [ Post ])
	posts: Post[];

	@Field() hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String) //provided from graphql
	textSnippet(
		//everytime we get Post obj textSnippet will call
		@Root() root: Post
	) {
		return root.text.slice(0, 100);
	}


	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int)
		limit: number,
		@Arg('cursor', () => String, { nullable: true })
		cursor: string | null
		//@Info() info:any
	): Promise<PaginatedPosts> {
		//cursor is giving us position which will be our reference
		const realLimit = Math.min(50, limit);
		//fetching x + 1 posts that client asked to
		const realLimitPlusOne = realLimit + 1;

		const replacements:any[] = [realLimitPlusOne]
		if(cursor){
			replacements.push(new Date(parseInt(cursor)))
		}
		const posts = await getConnection().query(`
			select p.*,
			json_build_object(
				'id', u.id,
				'username', u.username,
				'email', u.email,
				'createdAt', u."createdAt",
				'updatedAt', u."updatedAt"
			) author
			from post as p
			inner join public.user as u on u.id = p."authorId"
			${cursor ? `where p."createdAt" < $2`: ""}
			order by p."createdAt" DESC
			limit $1
		`, replacements)
		
		console.log("posts: ", posts);

		// const queryBuilder = getConnection()
		// 	.getRepository(Post)
		// 	.createQueryBuilder('p') // p - alias for post
		// 	.innerJoinAndSelect("p.author", "author", 'author.id = p."authorId"')
		// 	.orderBy('p."createdAt"', 'DESC')
		// 	.take(realLimitPlusOne);
		// if (cursor) {
		// 	//paging through items with createdAt as a reference
		// 	queryBuilder.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
		// }
		//const posts = await queryBuilder.getMany();

		return { posts: posts.slice(0, realLimit), hasMore: posts.length === realLimitPlusOne };
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id') id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(@Arg('options') options: PostInput, @Ctx() { req }: MyContext): Promise<Post> {
		const post = Post.create({
			...options,
			authorId: req.session.userId
		}).save();

		return post;
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(@Arg('id') id: number, @Arg('options') options: PostInput): Promise<Post | null> {
		const post = await Post.findOne({ where: { id } });
		if (!post) {
			return null;
		}
		if (typeof options.title !== undefined) {
			await Post.update(
				{ id },
				{
					title: options.title,
					text: options.text
				}
			);
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id);
		return true;
	}
}
