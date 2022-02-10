import { GetStaticProps } from 'next'
import React, { useState } from 'react'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typing'
import PortableText from 'react-portable-text'
import { SubmitHandler, useForm } from 'react-hook-form'

interface IFormInput {
  _id: string
  name: string
  email: string
  comment: string
}

interface Props {
  post: Post
}

const Post = ({ post }: Props) => {
  console.log(post)

  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>()

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    await fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        console.log(data)
        setSubmitted(true)
      })
      .catch((err) => {
        console.log(err)
        setSubmitted(false)
      })
  }

  return (
    <div>
      <Header />
      <img
        className="h-40 w-full object-cover"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />
      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="mb-2 text-xl font-light text-gray-500">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2 ">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
            alt=""
          />
          <p className="text-sm font-extralight">
            Blog by <span className="text-green-600"> {post.author.name}</span>{' '}
            - Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-5">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: (props: any) => {
                return <h1 className="my-5 text-2xl font-bold" {...props} />
              },
              h2: (props: any) => {
                return <h1 className="my-5 text-xl font-bold" {...props} />
              },
              li: ({ children }: any) => {
                return <li className="ml-4 list-disc"> {children}</li>
              },
              link: ({ href, children }: any) => {
                return (
                  <a href={href} className="text-blue-500 hover:underline">
                    {children}
                  </a>
                )
              },
            }}
          />
        </div>
      </article>

      <hr className="my-5 mx-auto max-w-lg border border-yellow-500" />

      {submitted ? (
        <div className='flex flex-col py-10 p-5 my-10 bg-yellow-500 text-white max-w-2xl mx-auto'>
          <h2>Thank you for submitting</h2>
          <p>
            Once it has been approved, it will appear below
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto flex max-w-2xl flex-col border border-yellow-500 p-5"
        >
          <h3 className="text-sm text-yellow-500">Enjoyed this article</h3>
          <h4 className="text-3xl font-bold">Leave a comment below</h4>
          <hr className="mt-2 py-3" />

          <input
            {...register('_id')}
            type="hidden"
            name="_id"
            value={post._id}
          />

          <label className="mb-5 block">
            <span className="text-gray-700">Name </span>
            <input
              {...register('name', { required: true })}
              className="rouded-full form-input mt-1 block w-full border py-3 px-3 shadow outline-none ring-yellow-500 focus:ring "
              placeholder="ABC"
              type="text"
            ></input>
          </label>
          <label className="mb-5 block">
            <span className="text-gray-700">Email </span>
            <input
              {...register('email', { required: true })}
              className="rouded-full form-input mt-1 block w-full border py-3 px-3 shadow outline-none ring-yellow-500 focus:ring "
              placeholder="ABC"
              type="email"
            ></input>
          </label>
          <label className="mb-5 block">
            <span className="text-gray-700">Comment </span>
            <textarea
              {...register('comment', { required: true })}
              className="rounded-py-2 form-textarea mt-1 block w-full border px-3 shadow outline-none ring-yellow-500 focus:ring"
              placeholder="ABC"
              rows={8}
            ></textarea>
          </label>
          {/*errors will return when the validation fails */}
          <div className="col-5 flex flex-col">
            {errors.name && (
              <span className="text-red-500"> The name field is required</span>
            )}
            {errors.email && (
              <span className="text-red-500"> The email field is required</span>
            )}
            {errors.comment && (
              <span className="text-red-500">
                The comment field is required
              </span>
            )}
          </div>

          <input
            type="submit"
            className="focus:shadow-outline cursor-pointer rounded bg-yellow-500 py-2 px-4 font-bold text-white shadow hover:bg-yellow-400 focus:outline-none"
          />
        </form>
      )}

      <div className='flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-y-2'>
        <h3 className='text-4xl'>Comments</h3>
        <hr className='pb-2' />

        {post.comments.map((comment) => (
          <div key={comment._id}>
            <p>
              <span className='text-yellow-500'>{comment.name} </span>
              {comment.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Post

//give back an array of path, all the slug that we need back
//get Static will update every 60s not like SSR to update per request
export const getStaticPaths = async () => {
  const query = `
    *[_type == 'post']{
        _id,
        slug {
        current
      }
      }
    `

  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))
  return {
    paths,
    fallback: 'blocking',
  }
}

//use these slugs to get the information for each page
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == 'post'&& slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author -> {
        name, 
        image
      },
     'comments': *[
       _type == 'comment' &&
       post._ref == ^._id &&
       approved == true
     ],
      description,
      mainImage,
      body
      }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
      //will return 404 page
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60, //update the old cache
  }
}
