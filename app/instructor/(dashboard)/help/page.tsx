import { BookOpen, User, Video, Coins, Share2, Calendar, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

export default function InstructorHelpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-400 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent mb-3">
          Instructor Guide
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to know about teaching on Lean Sporty, from setting up your profile to earning tokens
        </p>
      </div>

      {/* Quick Start Section */}
      <section className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 mb-8 border border-pink-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-pink-500" />
          Quick Start Checklist
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <p className="text-gray-700">Get your instructor invite code from the Lean Sporty team</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <p className="text-gray-700">Log in with Google or Apple</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <p className="text-gray-700">Enter your invite code on the instructor login page</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <p className="text-gray-700">Create your instructor profile</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
            <p className="text-gray-700">Schedule your first live stream</p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="space-y-8">

        {/* Getting Started */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Getting Started as an Instructor</h2>
              <p className="text-gray-600">How to join the Lean Sporty instructor community</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I become an instructor?</h3>
              <p className="text-gray-700 mb-3">
                Lean Sporty uses an invite-only system to ensure quality instruction. To become an instructor:
              </p>
              <ol className="space-y-2 ml-6 list-decimal text-gray-700">
                <li>Contact the Lean Sporty team to request an instructor invite code</li>
                <li>Once approved, you'll receive a unique access code</li>
                <li>Visit the instructor login page (link in the footer)</li>
                <li>Sign in with your Google or Apple account</li>
                <li>Enter your instructor access code</li>
                <li>Complete your instructor profile setup</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Important Note</p>
                  <p className="text-blue-800 text-sm">
                    You only need the invite code once. After creating your profile, you can access the instructor
                    dashboard anytime by signing in with your Google or Apple account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Setting Up Your Profile */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting Up Your Profile</h2>
              <p className="text-gray-600">Create a professional profile that attracts students</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your public profile</h3>
              <p className="text-gray-700 mb-4">
                Your instructor profile is public and appears at <span className="font-mono bg-gray-100 px-2 py-1 rounded">leansporty.com/@yourname</span>.
                This is where potential students learn about you before enrolling in your classes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile information</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Display Name (Required)</p>
                    <p className="text-gray-600 text-sm">Your name as students will see it. This appears on all your streams.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Profile URL (Required)</p>
                    <p className="text-gray-600 text-sm">
                      Your unique URL slug (e.g., "sarahfitness"). This is auto-generated from your name but you can customize it.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Bio (Recommended)</p>
                    <p className="text-gray-600 text-sm">
                      Tell students about your experience, certifications, and teaching style. A compelling bio increases enrollments!
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Profile Photo (Recommended)</p>
                    <p className="text-gray-600 text-sm">
                      A professional, friendly photo helps build trust. You'll have a special gradient ring around your photo as an instructor!
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Social Links (Optional)</p>
                    <p className="text-gray-600 text-sm">Link your Instagram and website to build your brand and connect with students.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-pink-900 mb-1">Pro Tip</p>
                  <p className="text-pink-800 text-sm">
                    Complete profiles get more enrollments! The dashboard shows your profile completion percentage
                    and reminds you what's missing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Creating & Managing Streams */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating & Managing Streams</h2>
              <p className="text-gray-600">Schedule and run your live fitness classes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to create a stream</h3>
              <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                <li>
                  <p className="font-semibold text-gray-900">Navigate to "Create Stream"</p>
                  <p className="text-sm text-gray-600">Click the "Create Stream" button on your dashboard or in the navigation.</p>
                </li>
                <li>
                  <p className="font-semibold text-gray-900">Fill in stream details</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 ml-4">
                    <li>• <strong>Title:</strong> Clear, descriptive name (e.g., "30-Min HIIT Dance Cardio")</li>
                    <li>• <strong>Description:</strong> What to expect, fitness level, equipment needed</li>
                    <li>• <strong>Date & Time:</strong> When your class will start</li>
                    <li>• <strong>Duration:</strong> How long the class will be (in minutes)</li>
                    <li>• <strong>Price:</strong> Number of tokens required to join</li>
                    <li>• <strong>Thumbnail:</strong> Optional image URL for your stream</li>
                  </ul>
                </li>
                <li>
                  <p className="font-semibold text-gray-900">Publish your stream</p>
                  <p className="text-sm text-gray-600">Your stream appears immediately on the public streams page and your profile.</p>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stream status explained</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Scheduled</p>
                  </div>
                  <p className="text-sm text-blue-800">
                    Your stream is published and students can enroll. Appears in "Upcoming Streams".
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse"></div>
                    <p className="font-semibold text-red-900">Live</p>
                  </div>
                  <p className="text-sm text-red-800">
                    Your stream is currently broadcasting. Appears in "LIVE NOW" section with special styling.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                    <p className="font-semibold text-gray-900">Ended</p>
                  </div>
                  <p className="text-sm text-gray-700">
                    Stream finished. Shows in your "Past Classes" and recording becomes available.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Going live - it's easy!</h3>
              <p className="text-gray-700 mb-4">
                Broadcasting your class is simple - everything happens in your browser with just one button click.
                Here's what to do:
              </p>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200 mb-6">
                <p className="font-bold text-gray-900 mb-4 text-lg">Quick Start Guide:</p>
                <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                  <li>
                    <p className="font-semibold text-gray-900">Open your broadcast page</p>
                    <p className="text-sm text-gray-600">Go to "My Streams" and click "Manage →" on your scheduled stream</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Click "Start Broadcast"</p>
                    <p className="text-sm text-gray-600">Allow camera and microphone access when your browser asks</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Wait for the connection</p>
                    <p className="text-sm text-gray-600">You'll see a red "LIVE" badge appear when you're connected (usually takes just a few seconds)</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">That's it! You're live</p>
                    <p className="text-sm text-gray-600">Your stream automatically becomes visible to students. Start teaching!</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">When you're done</p>
                    <p className="text-sm text-gray-600">Click "Stop Broadcast" then confirm "End Stream"</p>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">What happens when you click "Start Broadcast"?</p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
                      <li>Your camera and microphone turn on (you'll see yourself on screen)</li>
                      <li>The system connects you to the streaming servers</li>
                      <li>Your stream automatically switches from "Scheduled" to "LIVE"</li>
                      <li>Students who enrolled can now watch your class</li>
                      <li>Your stream appears in the "LIVE NOW" section on the homepage</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-900 mb-1">Browser Requirements</p>
                <p className="text-sm text-green-800">
                  Works best in Chrome, Firefox, or Safari. Make sure you have a stable internet connection
                  (at least 5 Mbps upload speed recommended) and good lighting for the best experience.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ending your class</h3>
              <p className="text-gray-700 mb-4">
                When you're finished teaching, ending your stream is just as simple as starting it.
              </p>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200 mb-6">
                <p className="font-bold text-gray-900 mb-4 text-lg">How to end your stream:</p>
                <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                  <li>
                    <p className="font-semibold text-gray-900">Click "Stop Broadcast"</p>
                    <p className="text-sm text-gray-600">Your camera and microphone turn off immediately</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Confirm you want to end</p>
                    <p className="text-sm text-gray-600">A popup asks "Are you sure you want to end this stream?"</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Click "OK" to confirm</p>
                    <p className="text-sm text-gray-600">Your stream is now marked as ended</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">That's it!</p>
                    <p className="text-sm text-gray-600">The recording becomes available to students automatically</p>
                  </li>
                </ol>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">What happens when you end your stream?</p>
                    <ul className="text-sm text-purple-800 space-y-1 list-disc ml-4">
                      <li>Your camera and microphone turn off</li>
                      <li>The stream status changes from "LIVE" to "ENDED"</li>
                      <li>Students can no longer join the live class</li>
                      <li>The recording becomes available automatically</li>
                      <li>Enrolled students can watch the replay for 7 days</li>
                      <li>Your earnings are finalized based on total enrollments</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">Important: Recording Availability</p>
                    <p className="text-amber-800 text-sm">
                      Your class is automatically recorded while you broadcast. After you end the stream,
                      the recording is available to enrolled students for <strong>7 days</strong>. After that,
                      it's automatically deleted. This gives students time to re-watch the class while keeping
                      your content exclusive!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if something goes wrong?</h3>
              <p className="text-gray-700 mb-4">
                Don't worry - we've built in resilience for common technical issues during your class.
              </p>

              <div className="space-y-4">
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-cyan-900 mb-2">Reconnecting After Connection Loss</p>
                      <p className="text-cyan-800 text-sm mb-3">
                        If your connection drops during class (battery dies, browser crashes, network issues, or accidental refresh),
                        you can easily reconnect without ending your stream:
                      </p>
                      <ol className="text-sm text-cyan-800 space-y-2 ml-6 list-decimal">
                        <li>Open the broadcast page again (same device or different device)</li>
                        <li>You'll see a blue <strong>"Reconnect Broadcast"</strong> button instead of the pink "Start Broadcast"</li>
                        <li>Click it to continue your class from where you left off</li>
                        <li>Your original start time and analytics are preserved</li>
                        <li>Students stay enrolled and can continue watching</li>
                      </ol>
                      <p className="text-xs text-cyan-700 mt-3 font-medium">
                        Common scenarios: laptop battery dies, switch to phone, browser refresh, network drop, computer sleep
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Browser Warning Protection</p>
                      <p className="text-yellow-800 text-sm">
                        When your stream is live, if you try to close the tab or refresh the page, your browser will warn you:
                        "Your stream is still live. Are you sure you want to leave?" This helps prevent accidental disconnections.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-900 mb-1">Cannot Restart Ended Streams</p>
                      <p className="text-rose-800 text-sm">
                        Once you've ended a stream (by clicking "Stop Broadcast" and confirming), you cannot restart it.
                        This is intentional - each class should be a separate session with its own recording and analytics.
                        To teach again, simply create a new stream.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Easy Broadcasting</p>
                  <p className="text-blue-800 text-sm">
                    No special software required - everything works directly in your browser!
                    Just allow camera and microphone access and you're ready to broadcast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Earning Tokens */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Coins className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Earning Tokens</h2>
              <p className="text-gray-600">How you get paid for teaching classes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How earning works</h3>
              <p className="text-gray-700 mb-4">
                You earn tokens when students enroll in your streams. Each stream has a token price that you set when creating it.
              </p>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200 mb-4">
                <p className="text-2xl font-bold text-gray-900 mb-2">Example:</p>
                <div className="space-y-2 text-gray-700">
                  <p>• You set your stream price at <strong>100 tokens</strong></p>
                  <p>• <strong>15 students</strong> enroll in your class</p>
                  <p className="text-xl font-semibold text-pink-600">= You earn 1,500 tokens 💰</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Viewing your earnings</h3>
              <p className="text-gray-700 mb-3">Track your earnings on your instructor dashboard:</p>
              <ul className="space-y-2 ml-6 list-disc text-gray-700">
                <li><strong>Total Tokens Earned:</strong> Shows your all-time earnings across all streams</li>
                <li><strong>Per-Stream Stats:</strong> Each stream card shows individual enrollment count and token price</li>
                <li><strong>Recent Enrollments:</strong> See who's joining your classes in real-time</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Setting your prices</h3>
              <p className="text-gray-700 mb-3">Consider these factors when pricing your streams:</p>
              <ul className="space-y-2 ml-6 list-disc text-gray-700">
                <li><strong>Duration:</strong> Longer classes typically command higher prices</li>
                <li><strong>Difficulty Level:</strong> Advanced or specialized classes may be priced higher</li>
                <li><strong>Your Experience:</strong> Build your reputation with reasonably priced classes first</li>
                <li><strong>Market Rate:</strong> Check what other instructors charge for similar classes</li>
              </ul>

              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-900 mb-1">Recommended Starting Prices</p>
                <ul className="text-sm text-green-800 space-y-1 ml-4">
                  <li>• 30-minute class: 50-100 tokens</li>
                  <li>• 45-minute class: 75-150 tokens</li>
                  <li>• 60-minute class: 100-200 tokens</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Token Withdrawals</p>
                  <p className="text-yellow-800 text-sm">
                    The ability to withdraw tokens to real money is currently being implemented.
                    You'll be able to cash out your earnings soon! Check back for updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Best Practices for Success</h2>
              <p className="text-gray-600">Tips to maximize your enrollments and build a following</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Use a clear, professional profile photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Write a friendly, authentic bio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Mention certifications and experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Link your Instagram for social proof</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stream Creation Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Write descriptive, engaging titles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Clearly state fitness level required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>List equipment needed (if any)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Use eye-catching thumbnail images</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Scheduling Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Post streams at least 1 week in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Choose consistent days/times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Consider different time zones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Offer variety in class types</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">During Your Class</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Start on time and be prepared</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Welcome students and build energy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Provide clear, safe instruction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>End with cool down and thank you</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600">Quick answers to common questions</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I edit a stream after creating it?</h3>
              <p className="text-gray-700">
                Not yet, but this feature is coming soon! For now, if you need to change details, you'll need to delete
                the stream and create a new one. Make sure to double-check all details before publishing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens if I need to cancel a stream?</h3>
              <p className="text-gray-700">
                Currently, you can delete scheduled streams from the "My Streams" page. Enrolled students should be notified
                (notification system coming soon). Try to avoid cancellations when possible to maintain your reputation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do students find my classes?</h3>
              <p className="text-gray-700 mb-2">Students can discover your classes through:</p>
              <ul className="ml-6 list-disc text-gray-700 space-y-1">
                <li>The public Streams page (shows all upcoming and live classes)</li>
                <li>Your public instructor profile (@yourname)</li>
                <li>Direct links you share on social media</li>
                <li>The app's home page featuring live and upcoming classes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I teach multiple classes at once?</h3>
              <p className="text-gray-700">
                You can schedule as many streams as you want, but you can only broadcast one at a time.
                Make sure your class times don't overlap!
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do I need special equipment?</h3>
              <p className="text-gray-700 mb-2">
                You only need basic equipment to broadcast:
              </p>
              <ul className="ml-6 list-disc text-gray-700 space-y-1">
                <li>A computer, tablet, or phone with a camera</li>
                <li>Built-in or external microphone</li>
                <li>Stable internet connection (5+ Mbps upload recommended)</li>
                <li>Modern web browser (Chrome, Firefox, or Safari)</li>
                <li>Good lighting (natural light or a ring light works great)</li>
              </ul>
              <p className="text-gray-700 mt-2">
                No special broadcasting software is needed - everything works directly in your browser!
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Will my classes be recorded?</h3>
              <p className="text-gray-700">
                Yes! Classes are automatically recorded and become available to enrolled students after the stream ends.
                This adds value to your classes as students can revisit the workout.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I update my profile?</h3>
              <p className="text-gray-700">
                Click "My Profile" in the instructor navigation (top of page), or go directly to the profile page
                from your dashboard. Changes are saved immediately and update your public profile.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can students contact me directly?</h3>
              <p className="text-gray-700">
                Not yet, but a messaging system is planned! For now, students can find you through your social media
                links (Instagram, website) that you add to your profile.
              </p>
            </div>
          </div>
        </section>

        {/* Need More Help */}
        <section className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="text-pink-50 mb-6 max-w-2xl mx-auto">
            We're here to help! Reach out to the Lean Sporty team for support, feedback, or suggestions.
          </p>
          <a
            href="mailto:instructors@leansporty.com"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            Contact Support
          </a>
        </section>

      </div>
    </div>
  );
}
