import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const Landingpage = () => {

	const navigate = useNavigate();

	return (
		<div className='min-h-screen bg-[#020817] text-white'>
			<div className='container mx-auto px-4 pt-20 pb-12'>
				{/* Hero Section */}
				<div className='max-w-5xl mx-auto text-center'>
					<h1 className='text-4xl md:text-6xl font-bold mb-6 leading-tight'>
						Get Testimonials from your
						<br />
						customers with ease
					</h1>
					<p className='text-lg md:text-xl text-gray-400 mb-8 max-w-4xl mx-auto'>
						Collecting testimonials is hard, we get it. So we built Testimonial,
						in minutes, you can collect text and video testimonials from your
						customers with no need for a developer or website hosting
					</p>

					{/* CTA Buttons */}
					<div className='flex justify-center gap-4 mb-6'>
						<button
						  onClick={()=>{
							navigate("/signup")
						  }}
						 className='bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-md font-medium'>
							Try FREE now
						</button>
						<button className='border border-blue-500 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-500/10'>
							Talk to us
						</button>
					</div>

					{/* Pricing Link */}
					<p className='text-gray-400 mb-16'>
						Get started with free credits on us.{' '}
						<a href='#pricing' className='text-blue-500 hover:underline'>
							See our pricing
						</a>{' '}
						→
					</p>
				</div>

				{/* Divider */}
				<div className='max-w-4xl mx-auto border-t border-gray-800 my-16'></div>

				

				{/* Second Section */}
				<div className='max-w-5xl mx-auto text-center'>


					{/* Testimonials Wall Preview */}

					
					<div className='w-full  rounded-lg overflow-hidden shadow-2xl h-1/4 mt-3'>
						<iframe
    src="http://localhost:5173/walloflove/masonaryanimated/CareerPlanB?darktheme=true&hidedate=true&showheartanimation=true&pauseonhover=true"
    frameborder="0"
    scrolling="yes"
    width="100%"
    height="500px">
</iframe>

						<h2 className='text-4xl md:text-6xl font-bold mb-6 leading-tight'>
							Add testimonials to your
							<br />
							website with no coding!
						</h2>
						<p className='text-lg md:text-xl text-gray-400 mb-12 max-w-4xl mx-auto'>
							Copy and paste our HTML code to add the Wall Of Love (👉 full
							version) to your website. We support any no-code platform (Webflow,
							WordPress, you name it!)
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Landingpage;