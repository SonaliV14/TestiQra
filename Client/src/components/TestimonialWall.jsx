import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import axios from 'axios';
import { BACKEND_URL } from '../utils/DB';

const formatDate = (dateString) => {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// TestimonialCard Component with display name
const TestimonialCard = React.memo(({ testimonial, isDragging }) => {
    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 mb-6 ${isDragging ? 'shadow-2xl' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                    <img
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-md"
                        src={testimonial.UserImageURL}
                        alt={testimonial.name}
                    />
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-800">{testimonial.name}</h3>
                    <div className="flex mt-1">
                        {[...Array(testimonial.Rating)].map((_, i) => (
                            <Star
                                key={i}
                                className="w-4 h-4 text-yellow-400 fill-current"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {testimonial.imageURL && (
                <div className="mb-4">
                    <img
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                        src={testimonial.imageURL}
                        alt="Testimonial"
                    />
                </div>
            )}

            <p className="text-gray-600 text-base leading-relaxed mb-4">
                {testimonial.Content}
            </p>

            <div className="text-sm text-gray-500 font-medium border-t pt-4">
                {formatDate(testimonial.submittedAt)}
            </div>
        </div>
    );
});

TestimonialCard.displayName = 'TestimonialCard';

// Main TestimonialWall Component
const TestimonialWall = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState('newest');
    const { spacename } = useParams();

    // Masonry breakpoints
    const breakpointColumnsObj = {
        default: 3,
        1100: 2,
        700: 1
    };

    const masonryStyles = {
        '.my-masonry-grid': {
            display: 'flex',
            marginLeft: '-30px', 
            width: 'auto'
        },
        '.my-masonry-grid_column': {
            paddingLeft: '30px', 
            backgroundClip: 'padding-box'
        }
    };

    useEffect(() => {
        const fetchSpaceInfo = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/v1/fetchtestimonials`, {
                    params: { spacename },
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                });

                const savedOrder = localStorage.getItem(`testimonialOrder-${spacename}`);
                const savedSortOrder = localStorage.getItem(`sortOrder-${spacename}`);

                if (savedOrder) {
                    const orderMap = new Map(JSON.parse(savedOrder));
                    const orderedTestimonials = [...response.data.testimonials].sort((a, b) => {
                        return (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0);
                    });
                    setTestimonials(orderedTestimonials);
                } else {
                    setTestimonials(response.data.testimonials);
                }

                if (savedSortOrder) {
                    setSortOrder(savedSortOrder);
                }
            } catch (error) {
                console.error('Error fetching testimonials:', error);
            }
        };

        fetchSpaceInfo();
    }, [spacename]);

    useEffect(() => {
        if (testimonials.length > 0) {
            const order = testimonials.map((testimonial, index) => [testimonial.id, index]);
            localStorage.setItem(`testimonialOrder-${spacename}`, JSON.stringify(order));
            localStorage.setItem(`sortOrder-${spacename}`, sortOrder);
        }
    }, [testimonials, spacename, sortOrder]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(testimonials);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTestimonials(items);
    };

    const handleSort = (event) => {
        const value = event.target.value;
        setSortOrder(value);
        const sortedTestimonials = [...testimonials].sort((a, b) => {
            const dateA = new Date(a.submittedAt);
            const dateB = new Date(b.submittedAt);
            return value === 'newest' ? dateB - dateA : dateA - dateB;
        });
        setTestimonials(sortedTestimonials);
    };

    return (
        <div className="min-h-screen w-full bg-gray-100" style={{ margin: '-1px' }}>
            {/* Hero Section */}
            <div className="relative h-[500px] bg-gray-800 text-white">
                <div className="absolute inset-0 bg-black/50">
                    <img
                        src="https://wallpaperaccess.com/full/3604778.jpg"
                        alt="People celebrating"
                        className="w-full h-full object-cover opacity-50"
                    />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                    <h1 className="text-6xl font-bold text-center mb-8 text-white drop-shadow-lg">
                        Wall of love for {spacename}
                    </h1>

                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg transition-colors text-lg font-semibold shadow-lg">
                        Submit your testimonial
                    </button>

                    <p className="mt-6 text-lg font-medium text-white/90">
                        Build your own wall? It's free 👉
                    </p>
                </div>
            </div>

            {/* Testimonials Masonry Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <style>
                    {`
                        .my-masonry-grid {
                            display: flex;
                            margin-left: -30px;
                            width: auto;
                        }
                        .my-masonry-grid_column {
                            padding-left: 30px;
                            background-clip: padding-box;
                        }
                    `}
                </style>
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                >
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard
                            key={testimonial.id || index}
                            testimonial={testimonial}
                        />
                    ))}
                </Masonry>
            </div>

            {/* Reorder Modal */}
            {isReorderModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Drag and drop to reorder</h2>
                            <button
                                onClick={() => setIsReorderModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <select
                                value={sortOrder}
                                onChange={handleSort}
                                className="w-32 px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </div>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="testimonials">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-4"
                                    >
                                        {testimonials.map((testimonial, index) => (
                                            <Draggable
                                                key={testimonial.id || index}
                                                draggableId={String(testimonial.id || index)}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="cursor-move"
                                                    >
                                                        <TestimonialCard
                                                            testimonial={testimonial}
                                                            isDragging={snapshot.isDragging}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            )}

            {/* Reorder Button */}
            <div className="fixed bottom-8 right-8">
                <button
                    onClick={() => setIsReorderModalOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    Reorder
                </button>
            </div>
        </div>
    );
};

TestimonialWall.displayName = 'TestimonialWall';

export default TestimonialWall;